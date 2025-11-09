import React, { useState, useRef, useCallback } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface MessageInputProps {
    onSendMessage: (content: string) => void;
    onSendFileMessage: (fileData: {
        fileUrl: string;
        messageType: 'image' | 'voice' | 'file';
        content?: string;
        duration?: number;
        fileSize: number;
        mimeType: string;
    }) => void;
    onStartTyping?: () => void;
    onStopTyping?: () => void;
    isConnected: boolean;
    disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
                                                              onSendMessage,
                                                              onSendFileMessage,
                                                              onStartTyping,
                                                              onStopTyping,
                                                              isConnected,
                                                              disabled = false
                                                          }) => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { uploadFile, isUploading, uploadProgress } = useFileUpload();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !disabled && isConnected && !isUploading) {
            onSendMessage(message.trim());
            setMessage('');
            handleStopTyping();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setMessage(value);

        if (isConnected) {
            if (value.trim() && message.trim() === '') {
                if (onStartTyping) {
                    onStartTyping();
                }
                setIsTyping(true);
            } else if (!value.trim() && message.trim()) {
                if (onStopTyping) {
                    onStopTyping();
                }
                setIsTyping(false);
            }
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (value.trim() && isConnected) {
            typingTimeoutRef.current = setTimeout(() => {
                if (onStopTyping) {
                    onStopTyping();
                }
                setIsTyping(false);
            }, 1000);
        }
    };

    const handleStopTyping = useCallback(() => {
        if (isTyping) {
            setIsTyping(false);
            if (onStopTyping) {
                onStopTyping();
            }
        }
    }, [isTyping, onStopTyping]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isConnected || disabled || isUploading) return;

        try {
            let messageType: 'image' | 'file' = 'file';
            if (file.type.startsWith('image/')) {
                messageType = 'image';
            }

            const uploadedFile = await uploadFile(file);

            onSendFileMessage({
                fileUrl: uploadedFile.url,
                messageType,
                content: message.trim() || undefined,
                fileSize: uploadedFile.size,
                mimeType: uploadedFile.mimeType
            });

            setMessage('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error('File upload error:', error);
            alert('Ошибка при загрузке файла');
        }
    };

    const startRecording = async () => {
        if (!isConnected || disabled || isUploading) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : 'audio/ogg';

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType
            });

            console.log('🎙️ Используем формат записи:', mimeType);

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            setRecordingTime(0);

            let recordedDuration = 0;
            const startTime = Date.now();

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                recordedDuration = Math.floor((Date.now() - startTime) / 1000);
                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                if (audioChunksRef.current.length === 0) {
                    stream.getTracks().forEach(track => track.stop());
                    setIsRecording(false);
                    setRecordingTime(0);
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, {
                    type: mimeType
                });

                if (recordedDuration < 0.5) {
                    stream.getTracks().forEach(track => track.stop());
                    setIsRecording(false);
                    setRecordingTime(0);
                    alert('Запись слишком короткая. Попробуйте записать дольше.');
                    return;
                }

                const audioFile = new File([audioBlob], `voice-message-${Date.now()}.${mimeType.split('/')[1]}`, {
                    type: mimeType
                });

                try {
                    const uploadedFile = await uploadFile(audioFile);

                    onSendFileMessage({
                        fileUrl: uploadedFile.url,
                        messageType: 'voice',
                        content: message.trim() || undefined,
                        duration: recordedDuration,
                        fileSize: uploadedFile.size,
                        mimeType: uploadedFile.mimeType
                    });

                    setMessage('');
                } catch (error) {
                    alert('Ошибка при отправке голосового сообщения');
                }

                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setRecordingTime(0);
            };

            mediaRecorder.start(100);
            setIsRecording(true);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            setIsRecording(false);
            setRecordingTime(0);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setRecordingTime(0);

            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    React.useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping) {
                handleStopTyping();
            }
            if (isRecording) {
                cancelRecording();
            }
        };
    }, [isTyping, isRecording, handleStopTyping]);

    return (
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0">
            {isUploading && (
                <div className="mb-2">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                        <span>Загрузка...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {isRecording && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="text-sm font-medium text-red-700">
                            Идет запись... {formatRecordingTime(recordingTime)}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={cancelRecording}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={stopRecording}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                        >
                            Отправить
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex space-x-3 items-end">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected || disabled || isUploading || isRecording}
                    className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Прикрепить файл"
                >
                    <span className="text-lg">📎</span>
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    className="hidden"
                />

                <button
                    type="button"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    disabled={!isConnected || disabled || isUploading}
                    className={`flex-shrink-0 p-3 rounded-lg transition-all duration-200 ${
                        isRecording
                            ? 'bg-red-500 text-white scale-110'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50'
                    }`}
                    title={isRecording ? 'Отпустите чтобы отправить' : 'Нажмите и удерживайте для записи'}
                >
                    <span className="text-lg">{isRecording ? '⏺️' : '🎤'}</span>
                </button>

                <div className="flex-1">
                    <input
                        type="text"
                        value={message}
                        onChange={handleChange}
                        placeholder={
                            !isConnected ? "Соединение..." :
                                disabled ? "Отправка сообщений отключена" :
                                    isUploading ? "Загрузка..." :
                                        isRecording ? "Идет запись голосового сообщения..." :
                                            "Введите сообщение..."
                        }
                        disabled={!isConnected || disabled || isUploading || isRecording}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!message.trim() || !isConnected || disabled || isUploading || isRecording}
                    className="flex-shrink-0 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    Отправить
                </button>
            </form>
        </div>
    );
};