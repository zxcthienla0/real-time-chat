import React, { useState, useRef } from 'react';
import type { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface MessageItemProps {
    message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content || '');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isOwnMessage = message.senderId === user?.id;

    const getFileUrl = (fileUrl?: string) => {
        if (!fileUrl) return '';
        if (fileUrl.startsWith('http')) return fileUrl;
        return `http://localhost:3000${fileUrl}`;
    };

    const handlePlayAudio = async () => {
        if (!message.fileUrl) return;

        try {
            setAudioError(false);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio();
            audioRef.current = audio;

            audio.src = getFileUrl(message.fileUrl);
            audio.preload = 'metadata';

            audio.onloadeddata = () => {
                setIsPlaying(true);
            };

            audio.onplay = () => {
                setIsPlaying(true);
            };

            audio.onpause = () => {
                setIsPlaying(false);
            };

            audio.onended = () => {
                setIsPlaying(false);
                audioRef.current = null;
            };

            audio.onerror = (e) => {
                console.error('Ошибка воспроизведения аудио:', e);
                setIsPlaying(false);
                setAudioError(true);
                audioRef.current = null;
            };

            await audio.play();

        } catch (error) {
            console.error('Ошибка при попытке воспроизведения:', error);
            setAudioError(true);
            setIsPlaying(false);
        }
    };

    const handleStopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }
    };

    const renderMessageContent = () => {
        if (message.isDeleted) {
            return (
                <div className="text-gray-400 italic">
                    Сообщение удалено
                </div>
            );
        }

        switch (message.messageType) {
            case 'text':
                return (
                    <div className="text-gray-800">
                        {message.content}
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-2">
                        {message.content && (
                            <div className="text-gray-800">{message.content}</div>
                        )}
                        <img
                            src={getFileUrl(message.fileUrl)}
                            alt="Uploaded image"
                            className="max-w-xs max-h-64 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(getFileUrl(message.fileUrl), '_blank')}
                            onError={(e) => {
                                console.error('Error loading image:', message.fileUrl);
                                e.currentTarget.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                            }}
                        />
                    </div>
                );

            case 'voice':
                return (
                    <div className="space-y-2">
                        {message.content && (
                            <div className="text-gray-800">{message.content}</div>
                        )}
                        <div className="flex items-center space-x-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <button
                                onClick={isPlaying ? handleStopAudio : handlePlayAudio}
                                disabled={audioError}
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                    audioError
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : isPlaying
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                <span className="text-white text-sm">
                                    {audioError ? '❌' : isPlaying ? '⏹️' : '▶️'}
                                </span>
                            </button>

                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-700">
                                    Голосовое сообщение
                                </div>
                                <div className="text-xs text-gray-500 flex items-center space-x-2">
                                    <span>{message.duration ? `${message.duration} сек` : 'Аудио'}</span>
                                    {audioError && (
                                        <span className="text-red-500">• Ошибка воспроизведения</span>
                                    )}
                                    {isPlaying && (
                                        <span className="text-green-500">• Воспроизводится</span>
                                    )}
                                </div>
                            </div>

                            {isPlaying && (
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 2, 1].map((height, index) => (
                                        <div
                                            key={index}
                                            className="w-1 bg-blue-500 rounded-full animate-pulse"
                                            style={{
                                                height: `${height * 6}px`,
                                                animationDelay: `${index * 0.1}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {audioError && (
                            <div className="text-xs text-gray-500 mt-1">
                                <a
                                    href={getFileUrl(message.fileUrl)}
                                    download
                                    className="text-blue-500 hover:underline"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Скачать аудио файл
                                </a>
                            </div>
                        )}
                    </div>
                );

            case 'file':
                return (
                    <div className="space-y-2">
                        {message.content && (
                            <div className="text-gray-800">{message.content}</div>
                        )}
                        <a
                            href={getFileUrl(message.fileUrl)}
                            download
                            className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-2xl">📎</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-700 truncate">
                                    Файл
                                </div>
                                <div className="text-xs text-gray-500">
                                    {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Скачать файл'}
                                </div>
                            </div>
                            <div className="text-xs text-blue-500 whitespace-nowrap">
                                Скачать
                            </div>
                        </a>
                    </div>
                );

            default:
                return (
                    <div className="text-gray-400 italic">
                        Неподдерживаемый тип сообщения
                    </div>
                );
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    React.useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    if (isEditing) {
        return (
            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                    isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'
                }`}>
                    <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-transparent border-none outline-none"
                        autoFocus
                    />
                    <div className="flex space-x-2 mt-2">
                        <button
                            className="text-xs hover:underline"
                            onClick={() => {
                                setIsEditing(false);
                            }}
                        >
                            Сохранить
                        </button>
                        <button
                            className="text-xs hover:underline"
                            onClick={() => {
                                setIsEditing(false);
                                setEditContent(message.content || '');
                            }}
                        >
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                isOwnMessage
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 rounded-bl-none'
            } shadow-sm`}>
                {!isOwnMessage && (
                    <div className="text-sm font-medium text-gray-700 mb-1">
                        {message.sender.nickname}
                    </div>
                )}

                {renderMessageContent()}

                <div className={`flex items-center justify-between mt-1 ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-400'
                }`}>
                    <div className="text-xs">
                        {formatTime(message.createdAt)}
                        {message.isEdited && !message.isDeleted && (
                            <span className="ml-1">(ред.)</span>
                        )}
                    </div>

                    {isOwnMessage && !message.isDeleted && message.messageType === 'text' && (
                        <div className="flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                                className="text-xs hover:underline"
                                onClick={() => {
                                    setIsEditing(true);
                                    setEditContent(message.content || '');
                                }}
                            >
                                Редактировать
                            </button>
                            <button
                                className="text-xs hover:underline"
                                onClick={() => {
                                }}
                            >
                                Удалить
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};