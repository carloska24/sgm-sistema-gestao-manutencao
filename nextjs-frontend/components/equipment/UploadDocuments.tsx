'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { Upload, X, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

interface UploadDocumentsProps {
  equipmentId: number;
  onUploadComplete: () => void;
}

export default function UploadDocuments({ equipmentId, onUploadComplete }: UploadDocumentsProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { success, error: showError } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload um arquivo por vez
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', 'other');

        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/equipment/${equipmentId}/documents`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao fazer upload');
        }
      }

      success('Documentos enviados com sucesso!');
      setFiles([]);
      onUploadComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      showError(message);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Selecione os arquivos
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        />
        <label
          htmlFor="file-upload"
          className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors"
        >
          <Upload className="w-5 h-5 text-slate-400 mr-2" />
          <span className="text-slate-400">Clique para selecionar arquivos</span>
        </label>
        <p className="text-xs text-slate-500 mt-2">
          Formatos permitidos: PDF, DOC, DOCX, JPG, PNG, GIF (máx. 10MB por arquivo)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">
            Arquivos selecionados ({files.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
            variant="primary"
          >
            {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}

