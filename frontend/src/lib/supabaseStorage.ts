import { supabase } from './supabase';

const BUCKET_NAME = 'email-images';

let bucketInitPromise: Promise<void> | null = null;

const ensureBucketInitialized = async () => {
  if (!bucketInitPromise) {
    bucketInitPromise = ensureBucketExists();
  }
  await bucketInitPromise;
};

/**
 * Initialize the email-images bucket if it doesn't exist.
 * This should be called once during app setup.
 */
export const ensureBucketExists = async () => {
  try {
    // Try to list the bucket to see if it exists
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }

    const bucketExists = data?.some(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Email images bucket created successfully');
      }
    }
  } catch (err) {
    console.error('Error ensuring bucket exists:', err);
  }
};

/**
 * Upload an image file to Supabase Storage and return the public URL
 */
export const uploadImageToStorage = async (
  file: Blob,
  options?: {
    fileName?: string;
    folder?: string;
    contentType?: string;
  }
): Promise<string> => {
  try {
    await ensureBucketInitialized();

    const deriveExtension = (name?: string, type?: string) => {
      if (name && name.includes('.')) {
        return name.split('.').pop()?.toLowerCase();
      }
      if (type && type.includes('/')) {
        return type.split('/')[1]?.toLowerCase();
      }
      return 'png';
    };

    const sanitizeFileName = (name: string) =>
      name
        .trim()
        .replace(/[^\w.\-]/g, '-')
        .replace(/-+/g, '-');

    const extension = deriveExtension(options?.fileName, file.type) || 'png';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const generatedName = `email-image-${timestamp}-${random}.${extension}`;
    const cleanFolder = options?.folder
      ? options.folder
          .replace(/^\/*/, '')
          .replace(/\/+$/g, '')
          .replace(/\.\./g, '')
      : '';
    const applyExtension = (name: string, ext: string) => {
      if (name.toLowerCase().endsWith(`.${ext}`)) {
        return name;
      }
      if (name.includes('.')) {
        return name;
      }
      return `${name}.${ext}`;
    };

    const fileName = options?.fileName && options.fileName.trim().length > 0
      ? `${timestamp}-${random}-${applyExtension(sanitizeFileName(options.fileName), extension)}`
      : generatedName;
    const path = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: options?.contentType || file.type || `image/${extension}`
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data, error: publicUrlError } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    if (publicUrlError) {
      console.error('Error getting public URL:', publicUrlError);
      throw publicUrlError;
    }

    if (!data?.publicUrl) {
      throw new Error('Public URL not available for uploaded image');
    }

    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to Supabase Storage:', err);
    throw err;
  }
};
