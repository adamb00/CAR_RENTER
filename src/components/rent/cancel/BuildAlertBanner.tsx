import { cn } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export default function buildAlertBanner(
  resultParam: string | undefined,
  tManage: Awaited<ReturnType<typeof getTranslations>>
) {
  if (!resultParam) return null;
  const variant = resultParam === 'success' ? 'success' : 'error';
  const message =
    resultParam === 'success'
      ? tManage('alerts.cancelSuccess')
      : resultParam === 'invalid'
      ? tManage('cancelErrors.invalid')
      : resultParam === 'notfound'
      ? tManage('cancelErrors.notFound')
      : resultParam === 'mismatch'
      ? tManage('cancelErrors.mismatch')
      : tManage('cancelErrors.generic');

  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm shadow-sm',
        variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
          : 'border-rose-200 bg-rose-50 text-rose-900'
      )}
    >
      {message}
    </div>
  );
}
