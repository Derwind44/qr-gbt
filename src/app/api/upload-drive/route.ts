import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { isAdminRequest, unauthorized } from '@/lib/server/guard';
import { getDrive } from '@/lib/server/googleDrive';
import { db, KTP_BUCKET } from '@/lib/server/supabaseAdmin';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Form field `kind`: 'profile' (default, Google Drive shared publicly for the QR card) or 'ktp'
 * (private Supabase bucket, saved as `storage:<path>` and viewed only through /api/ktp).
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const isKtp = formData.get('kind') === 'ktp';
    const folderId = process.env.GDRIVE_FOLDER_ID || process.env.NEXT_PUBLIC_GDRIVE_FOLDER_ID;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/') || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File harus gambar dan maksimal 5 MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `gbt_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (isKtp) {
      const ktpPath = `${randomUUID()}.${file.type.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'jpg'}`;
      const { error } = await db().storage.from(KTP_BUCKET).upload(ktpPath, buffer, { contentType: file.type });
      if (error) throw error;
      return NextResponse.json({ success: true, storage: 'supabase-private', url: `storage:${ktpPath}`, fileName });
    }

    // METHOD 1: Google Drive
    const drive = getDrive();
    if (drive) {
      try {
        const response = await drive.files.create({
          requestBody: { name: fileName, ...(folderId && { parents: [folderId] }) },
          media: { mimeType: file.type || 'image/jpeg', body: Readable.from(buffer) },
          supportsAllDrives: true,
          fields: 'id',
        });

        const fileId = response.data.id;
        if (fileId) {
          try {
            await drive.permissions.create({
              fileId,
              supportsAllDrives: true,
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
      } catch (gdriveErr) {
        console.warn('Google Drive upload failed, using fallback:', gdriveErr instanceof Error ? gdriveErr.message : gdriveErr);
      }
    }

    // METHOD 2: Public Supabase Storage bucket ('jemaat-photos')
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = db();
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

    // METHOD 3: Compressed Data URL
    const mime = file.type || 'image/jpeg';
    return NextResponse.json({
      success: true,
      storage: 'dataurl',
      url: `data:${mime};base64,${buffer.toString('base64')}`,
      fileName,
    });
  } catch (err) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: 'Gagal mengunggah foto.' }, { status: 500 });
  }
}
