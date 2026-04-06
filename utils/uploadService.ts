import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

/**
 * Compresses an image file and uploads it to a Supabase Storage bucket.
 * 
 * @param file The raw File object from an input.
 * @param bucketName The name of the storage bucket (e.g., 'spot-images').
 * @param folder The target folder inside the bucket (e.g., 'public/').
 * @returns An object containing either the `publicUrl` on success, or an `error` string.
 */
export async function compressAndUploadImage(
  file: File, 
  bucketName: string, 
  folder: string = 'public/'
): Promise<{ publicUrl?: string; error?: string }> {
  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    
    // 1. Compress
    const compressedFile = await imageCompression(file, options);
    
    // 2. Generate unique filename logic (using Math.random to guarantee no collisions if multiple uploaded fast)
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = `${folder}${fileName}`;

    // 3. Upload
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, compressedFile);

    if (uploadError) {
      return { error: `Storage error: ${uploadError.message}` };
    }

    // 4. Resolve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { publicUrl: publicUrlData.publicUrl };
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return { error: `Compression/Upload failed: ${message}` };
  }
}
