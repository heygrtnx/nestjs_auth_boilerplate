import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as crypto from 'crypto';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

@Injectable()
export class CloudinaryService {
  private readonly project: string;

  constructor(private configService: ConfigService) {
    this.project =
      this.configService.get<string>('PLATFORM_NAME') || 'default_project';

    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Prevents duplicate uploads by checking the image's hash before uploading.
   */
  async uploadImage(
    file: Buffer,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    const fileHash = this.generateFileHash(file);

    // Check if an image with this hash already exists
    const existingImage = await this.findExistingImage(fileHash);
    if (existingImage) {
      return existingImage; // Return the existing image URL instead of re-uploading
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${this.project}/${folder}`,
            allowed_formats: ['jpg', 'png', 'jpeg'],
            unique_filename: false, // Prevents unnecessary unique filenames
            overwrite: true, // Ensures the same image is not duplicated
            context: { file_hash: fileHash }, // Store file hash in Cloudinary metadata
          },
          (error, result) => {
            if (error) {
              reject(new Error(error.message));
            } else {
              resolve(result as CloudinaryUploadResult);
            }
          },
        )
        .end(file);
    });
  }

  /**
   * Generates an MD5 hash of the image file.
   */
  private generateFileHash(file: Buffer): string {
    return crypto.createHash('md5').update(file).digest('hex');
  }

  /**
   * Searches Cloudinary for an existing image with the same hash.
   */
  private async findExistingImage(
    fileHash: string,
  ): Promise<CloudinaryUploadResult | null> {
    try {
      const result = await cloudinary.search
        .expression(`context.file_hash=${fileHash}`)
        .execute();

      if (result.resources.length > 0) {
        return {
          secure_url: result.resources[0].secure_url,
          public_id: result.resources[0].public_id,
        };
      }
      return null;
    } catch (error) {
      console.error('Error searching Cloudinary:', error);
      return null;
    }
  }

  async deleteMedia(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error) => {
          if (error) {
            reject(new Error(error.message));
          } else {
            resolve();
          }
        },
      );
    });
  }

  extractPublicIdFromUrl(url: string): string {
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/;
    const match = url.match(regex);
    if (match) {
      return match[1];
    }
    throw new Error('Invalid Cloudinary URL');
  }
}
