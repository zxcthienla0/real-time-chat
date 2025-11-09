import type { UploadedFile } from '../types';

class UploadService {
    private baseUrl = 'http://localhost:3000/api';

    async uploadFile(file: File): Promise<UploadedFile> {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('accessToken');

        const response = await fetch(`${this.baseUrl}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Upload failed');
        }

        return result.file;
    }

    async uploadAudio(blob: Blob): Promise<UploadedFile> {
        const file = new File([blob], 'voice-message.wav', { type: 'audio/wav' });
        return this.uploadFile(file);
    }
}

export const uploadService = new UploadService();