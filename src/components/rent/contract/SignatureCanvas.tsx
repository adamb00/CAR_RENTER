'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import ReactSignatureCanvas, {
  type SignatureCanvasProps as ReactSignatureCanvasProps,
} from 'react-signature-canvas';

import { cn } from '@/lib/utils';

type SignatureCanvasProps = {
  className?: string;
  onChange: (dataUrl: string) => void;
};

export type SignatureCanvasHandle = {
  clear: () => void;
  getDataUrl: () => string;
  isEmpty: () => boolean;
};

const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
  function SignatureCanvas({ className, onChange }, ref) {
    const padRef = useRef<ReactSignatureCanvas | null>(null);

    const emitChange = () => {
      const pad = padRef.current;
      if (!pad) return;
      const dataUrl = pad.isEmpty() ? '' : pad.toDataURL('image/png');
      onChange(dataUrl);
    };

    const clear = () => {
      padRef.current?.clear();
      onChange('');
    };

    const getDataUrl = () => {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return '';
      return pad.toDataURL('image/png');
    };

    const isEmpty = () => {
      const pad = padRef.current;
      return !pad || pad.isEmpty();
    };

    useImperativeHandle(ref, () => ({ clear, getDataUrl, isEmpty }), [onChange]);

    const signatureOptions: ReactSignatureCanvasProps = {
      penColor: '#0f172a',
      backgroundColor: '#ffffff',
      clearOnResize: true,
      onEnd: emitChange,
      canvasProps: {
        className: 'h-40 w-full touch-none',
        style: { touchAction: 'none' },
      },
    };

    return (
      <div
        className={cn(
          'rounded-xl border border-slate-300 bg-white',
          className
        )}
      >
        <ReactSignatureCanvas ref={padRef} {...signatureOptions} />
      </div>
    );
  }
);

SignatureCanvas.displayName = 'SignatureCanvas';

export default SignatureCanvas;
