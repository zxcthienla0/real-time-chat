import { useState, useCallback } from 'react';
import type { UploadedFile } from '../types';

export const useFileUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const uploadFile = useCallback(async (file: File): Promise<UploadedFile> => {
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();

            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = (event.loaded / event.total) * 100;
                        setUploadProgress(progress);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        const response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            resolve(response.file);
                        } else {
                            reject(new Error(response.error || 'Upload failed'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                    setIsUploading(false);
                    setUploadProgress(0);
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                    setIsUploading(false);
                    setUploadProgress(0);
                });

                xhr.open('POST', 'http://localhost:3000/api/upload');

                const token = localStorage.getItem('accessToken');
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }

                xhr.send(formData);
            });
        } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            throw error;
        }
    }, []);

    const cancelUpload = useCallback(() => {
        setIsUploading(false);
        setUploadProgress(0);
    }, []);

    return {
        uploadFile,
        cancelUpload,
        isUploading,
        uploadProgress
    };
};