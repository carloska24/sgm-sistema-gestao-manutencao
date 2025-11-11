'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChecklistTemplate, ChecklistTemplateItem, ChecklistResponseStatus, ChecklistReferenceType } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CheckCircle, ChevronLeft, ChevronRight, Camera, FilePen, AlertTriangle, X, Upload, Loader2 } from 'lucide-react';
import SignaturePad from '@/components/ui/SignaturePad';

interface ChecklistItemState {
  item: ChecklistTemplateItem;
  status: ChecklistResponseStatus;
  value?: string;
  notes?: string;
  photo_path?: string | null;
  signature_path?: string | null;
  signature_data?: string | null;
}

interface StepperViewProps {
  itemsState: ChecklistItemState[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isEditable: boolean;
  updateItem: (index: number, partial: Partial<ChecklistItemState>) => void;
  handleToggle: (index: number) => void;
  handlePhotoUpload: (index: number, file: File) => Promise<void>;
  handlePhotoRemove: (index: number) => void;
  getPhotoUrl: (photoPath: string) => string | null;
  uploadingPhoto: number | null;
  fileInputRefs: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  showSignaturePad: number | null;
  setShowSignaturePad: (index: number | null) => void;
  expandedInstructions: Set<number>;
  setExpandedInstructions: React.Dispatch<React.SetStateAction<Set<number>>>;
  template: ChecklistTemplate | null;
  referenceType: ChecklistReferenceType;
  referenceId: number;
  handleSignatureSave: (index: number, signatureDataUrl: string) => void;
}

function StepperView({
  itemsState,
  currentStep,
  setCurrentStep,
  isEditable,
  updateItem,
  handleToggle,
  handlePhotoUpload,
  handlePhotoRemove,
  getPhotoUrl,
  uploadingPhoto,
  fileInputRefs,
  showSignaturePad,
  setShowSignaturePad,
  expandedInstructions,
  setExpandedInstructions,
  template,
  referenceType,
  referenceId,
  handleSignatureSave,
}: StepperViewProps) {
  const currentItem = itemsState[currentStep];
  const { item } = currentItem;
  const isBoolean = (item.input_type || 'boolean') === 'boolean';
  const isNumber = item.input_type === 'number';
  const isText = item.input_type === 'text';
  const totalSteps = itemsState.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Melhorado com Progresso */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
              currentItem.status === 'completed'
                ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                : 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400'
            }`}>
              {currentItem.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : currentStep + 1}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Passo {currentStep + 1} de {totalSteps}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-emerald-400">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-slate-500">concluído</div>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        
        {/* Badges de Requisitos */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {item.required && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-300 rounded-md text-xs font-medium border border-red-500/30">
              Obrigatório
            </span>
          )}
          {item.requires_photo && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md text-xs font-medium border border-blue-500/30 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Foto
            </span>
          )}
          {item.requires_signature && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-xs font-medium border border-purple-500/30 flex items-center gap-1">
              <FilePen className="w-3 h-3" /> Assinatura
            </span>
          )}
        </div>
      </div>

      {/* Card do Item Atual */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-2xl border-2 border-emerald-500/20 p-8 shadow-2xl backdrop-blur-sm"
        >

          {/* Instruções - Melhoradas */}
          {item.instructions && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  setExpandedInstructions(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(currentStep)) {
                      newSet.delete(currentStep);
                    } else {
                      newSet.add(currentStep);
                    }
                    return newSet;
                  });
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800/70 rounded-xl border border-slate-700/50 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-slate-300">Instruções Detalhadas</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedInstructions.has(currentStep) ? 'rotate-90' : ''}`} />
              </button>
              {expandedInstructions.has(currentStep) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30"
                >
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.instructions}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Campo de Resposta */}
          <div className="space-y-5 mb-6">
            {isBoolean ? (
              <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-800/60 to-slate-800/40 rounded-xl border-2 border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <label className="flex items-center gap-4 cursor-pointer flex-1 group">
                  <div className={`relative flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    currentItem.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900 border-slate-600 group-hover:border-emerald-500/50'
                  }`}>
                    {currentItem.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                    <input
                      type="checkbox"
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                      checked={currentItem.status === 'completed'}
                      onChange={() => isEditable && handleToggle(currentStep)}
                      disabled={!isEditable}
                    />
                  </div>
                  <span className={`text-lg font-semibold transition-colors ${
                    currentItem.status === 'completed' ? 'text-emerald-400' : 'text-white'
                  }`}>
                    Marcar como concluído
                  </span>
                </label>
              </div>
            ) : null}

            {isNumber && (
              <Input
                type="number"
                label="Valor Medido"
                value={currentItem.value || ''}
                onChange={(e) => updateItem(currentStep, { value: e.target.value })}
                disabled={!isEditable}
                className="bg-slate-800/50"
              />
            )}

            {isText && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Resposta</label>
                <textarea
                  value={currentItem.value || ''}
                  onChange={(e) => updateItem(currentStep, { value: e.target.value })}
                  rows={4}
                  disabled={!isEditable}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500/50"
                  placeholder="Descreva o resultado ou medições feitas..."
                />
              </div>
            )}

            {/* Notas - Melhoradas */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2.5 flex items-center gap-2">
                <FilePen className="w-4 h-4 text-slate-400" />
                Notas do Técnico
              </label>
              <textarea
                value={currentItem.notes || ''}
                onChange={(e) => updateItem(currentStep, { notes: e.target.value })}
                rows={3}
                disabled={!isEditable}
                className="w-full bg-slate-800/60 border-2 border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-y"
                placeholder="Observações adicionais, número de série, valores medidos..."
              />
            </div>

            {/* Foto */}
            {(item.requires_photo || currentItem.photo_path) && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {item.requires_photo ? 'Foto Obrigatória' : 'Foto (Opcional)'}
                </label>
                {currentItem.photo_path ? (
                  <div className="relative">
                    <div className="relative w-full rounded-xl overflow-hidden border-2 border-emerald-500/30 bg-white p-2">
                      <img
                        src={getPhotoUrl(currentItem.photo_path) || ''}
                        alt={`Foto do item ${item.title}`}
                        className="w-full h-auto max-h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23334155" width="200" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto não encontrada%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove(currentStep)}
                          className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white transition-colors shadow-lg"
                          title="Remover foto"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditable && (
                      <div className="mt-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          Trocar foto
                          <input
                            ref={(el) => (fileInputRefs.current[currentStep] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload(currentStep, file);
                            }}
                            disabled={!isEditable || uploadingPhoto === currentStep}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-3 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {uploadingPhoto === currentStep ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          {item.requires_photo ? 'Adicionar foto obrigatória' : 'Adicionar foto'}
                        </>
                      )}
                      <input
                        ref={(el) => (fileInputRefs.current[currentStep] = el)}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(currentStep, file);
                        }}
                        disabled={!isEditable || uploadingPhoto === currentStep}
                      />
                    </label>
                    {item.requires_photo && (
                      <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Foto obrigatória para concluir este item
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assinatura */}
            {(item.requires_signature || currentItem.signature_data || currentItem.signature_path) && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {item.requires_signature ? 'Assinatura Obrigatória' : 'Assinatura (Opcional)'}
                </label>
                {currentItem.signature_data || currentItem.signature_path ? (
                  <div className="relative">
                    <div className="relative w-full max-w-md rounded-xl overflow-hidden border-2 border-emerald-500/30 bg-white p-2">
                      <img
                        src={currentItem.signature_data || (currentItem.signature_path ? getPhotoUrl(currentItem.signature_path) : '') || ''}
                        alt={`Assinatura do item ${item.title}`}
                        className="w-full h-auto max-h-32 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23334155" width="200" height="200"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EAssinatura não encontrada%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => updateItem(currentStep, { signature_data: null, signature_path: null })}
                          className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-500 rounded-full text-white transition-colors shadow-lg"
                          title="Remover assinatura"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {isEditable && (
                      <div className="mt-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowSignaturePad(currentStep)}
                          className="flex items-center gap-2"
                        >
                          <FilePen className="w-4 h-4" />
                          Trocar assinatura
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSignaturePad(currentStep)}
                      disabled={!isEditable}
                      className="flex items-center gap-2"
                    >
                      <FilePen className="w-4 h-4" />
                      {item.requires_signature ? 'Adicionar assinatura obrigatória' : 'Adicionar assinatura'}
                    </Button>
                    {item.requires_signature && (
                      <p className="mt-2 text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Assinatura obrigatória para concluir este item
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navegação Melhorada */}
          <div className="pt-6 border-t border-slate-700/50">
            {/* Indicadores de Progresso */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {itemsState.map((itemState, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`relative transition-all ${
                    idx === currentStep
                      ? 'w-10 h-2 bg-emerald-500 rounded-full'
                      : idx < currentStep
                      ? 'w-2 h-2 bg-green-500/60 rounded-full hover:bg-green-500/80'
                      : 'w-2 h-2 bg-slate-600 rounded-full hover:bg-slate-500'
                  }`}
                  title={`Passo ${idx + 1}: ${itemState.item.title}`}
                >
                  {idx === currentStep && (
                    <motion.div
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Botões de Navegação */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 min-w-[120px] justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="text-xs text-slate-500 text-center px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                {currentStep + 1} de {totalSteps}
              </div>

              <Button
                variant="primary"
                onClick={handleNext}
                disabled={currentStep === totalSteps - 1}
                className="flex items-center gap-2 min-w-[120px] justify-center bg-emerald-500 hover:bg-emerald-600"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal de Assinatura */}
      {showSignaturePad === currentStep && (
        <SignaturePad
          title={`Assinatura: ${item.title}`}
          required={item.requires_signature || false}
          onSave={(signatureDataUrl) => {
            handleSignatureSave(currentStep, signatureDataUrl);
            setShowSignaturePad(null);
          }}
          onCancel={() => setShowSignaturePad(null)}
        />
      )}
    </div>
  );
}

export default StepperView;

