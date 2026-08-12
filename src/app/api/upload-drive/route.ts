import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID || process.env.GDRIVE_FOLDER_ID;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `gbt_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // METHOD 1: Try Google Drive API Upload
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (email && privateKey) {
      try {
        privateKey = privateKey.replace(/\\n/g, '\n');
        const auth = new google.auth.JWT({
          email,
          key: privateKey,
          scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const fileMetadata: any = { name: fileName };
        if (folderId) fileMetadata.parents = [folderId];

        const response = await drive.files.create({
          requestBody: fileMetadata,
          media: { mimeType: file.type || 'image/jpeg', body: stream },
          supportsAllDrives: true,
          supportsTeamDrives: true,
          fields: 'id, name, webViewLink',
        });

        const fileId = response.data.id;
        if (fileId) {
          try {
            await drive.permissions.create({
              fileId: fileId,
              supportsAllDrives: true,
              supportsTeamDrives: true,
              requestBody: { role: 'reader', type: 'anyone' },
            });
          } catch (pErr) {
            console.warn('Set permission warning:', pErr);
          }

          return NextResponse.json({
            success: true,
            storage: 'gdrive',
            fileId,
            url: `https://lh3.googleusercontent.com/d/${fileId}`,
            fileName,
          });
        }
      } catch (gdriveErr: any) {
        console.warn('Google Drive Service Account Quota Notice, switching to Supabase Storage:', gdriveErr?.message || gdriveErr);
      }
    }

    // METHOD 2: Fail-safe Fallback to Supabase Storage Bucket ('jemaat-photos')
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('jemaat-photos')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('jemaat-photos')
            .getPublicUrl(uploadData.path);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              storage: 'supabase',
              url: publicUrlData.publicUrl,
              fileName,
            });
          }
        }
      } catch (sbErr) {
        console.warn('Supabase storage fallback notice:', sbErr);
      }
    }

    // METHOD 3: High-Res Compressed Data URL Fallback
    const base64 = buffer.toString('base64');
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({
      success: true,
      storage: 'dataurl',
      url: dataUrl,
      fileName,
    });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengunggah foto.' },
      { status: 500 }
    );
  }
}
