import { supabase } from '@/integrations/supabase/client';
import { base64ToBlob } from './image';

export const saveCreation = async (
  userId: string,
  feature: string,
  originalFile: File,
  processedImage: string // data URL or object URL
) => {
  // This is a background task, so we wrap it in a try/catch to prevent UI crashes
  try {
    const processedBlob = await base64ToBlob(processedImage);

    const timestamp = Date.now();
    const fileExtension = originalFile.name.split('.').pop() || 'png';
    const originalFileName = originalFile.name.substring(0, originalFile.name.length - fileExtension.length -1);

    const originalPath = `${userId}/${timestamp}_${originalFileName}.${fileExtension}`;
    const processedPath = `${userId}/${timestamp}_${originalFileName}_processed.png`;

    const { error: originalUploadError } = await supabase.storage
      .from('creations')
      .upload(originalPath, originalFile);

    if (originalUploadError) throw new Error(`Failed to upload original image: ${originalUploadError.message}`);

    const { error: processedUploadError } = await supabase.storage
      .from('creations')
      .upload(processedPath, processedBlob);
    
    if (processedUploadError) {
      // Cleanup original upload if processed fails
      await supabase.storage.from('creations').remove([originalPath]);
      throw new Error(`Failed to upload processed image: ${processedUploadError.message}`);
    }

    const { error: dbError } = await supabase
      .from('creations')
      .insert({
        user_id: userId,
        feature: feature,
        original_storage_path: originalPath,
        processed_storage_path: processedPath,
      });

    if (dbError) {
      // Cleanup both uploads if db insert fails
      await supabase.storage.from('creations').remove([originalPath, processedPath]);
      throw new Error(`Failed to save creation record: ${dbError.message}`);
    }

    console.log('Creation saved successfully!');
    return true;

  } catch (error) {
    console.error('Error saving creation:', error);
    // Don't re-throw, just log it.
    return false;
  }
};