// import type { Metadata } from 'next';
// import { notFound, redirect } from 'next/navigation';
// import { revalidatePath } from 'next/cache';
// import { getTranslations } from 'next-intl/server';

// import { buildPageMetadata, getSiteUrl, resolveLocale } from '@/lib/seo';
// import { prisma } from '@/lib/prisma';
// import { STATUS_DONE, type RequestStatus } from '@/lib/requestStatus';
// import { getCarById } from '@/lib/cars';
// import { sendMail } from '@/lib/mailer';
// import { recordNotification } from '@/lib/notifications';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { cn } from '@/lib/utils';
// import type { RentFormValues } from '@/schemas/RentSchema';
// import { Prisma } from '@prisma/client';

// type PageParams = { locale: string; id: string };
// type SearchParams = { action?: string; result?: string };

// const RENT_ID_REGEX = /^[0-9a-fA-F-]{36}$/;

// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<PageParams>;
// }): Promise<Metadata> {
//   const { locale, id } = await params;
//   const resolvedLocale = resolveLocale(locale);
//   const t = await getTranslations({
//     locale: resolvedLocale,
//     namespace: 'RentManage',
//   });
//   const siteUrl = getSiteUrl();
//   const url = `${siteUrl}/${resolvedLocale}/rent/manage/${id}`;

//   const baseMeta = await buildPageMetadata({
//     locale: resolvedLocale,
//     pageKey: 'rent',
//     path: `/rent/manage/${id}`,
//     imagePath: '/header_image.webp',
//   });

//   return {
//     ...baseMeta,
//     title: t('meta.title'),
//     description: t('meta.description'),
//     alternates: {
//       canonical: url,
//     },
//   };
// }

// export default async function ManageRentPage({
//   params,
//   searchParams,
// }: {
//   params: Promise<PageParams>;
//   searchParams?: Promise<SearchParams>;
// }) {
//   const [routeParams, providedSearchParams] = await Promise.all([
//     params,
//     searchParams ?? Promise.resolve<SearchParams>({}),
//   ]);
//   const { locale, id } = routeParams;
//   const resolvedSearchParams: SearchParams = providedSearchParams;

//   if (!RENT_ID_REGEX.test(id)) {
//     notFound();
//   }

//   const resolvedLocale = resolveLocale(locale);
//   const actionParam = resolvedSearchParams?.action;
//   const actionResult = resolvedSearchParams?.result;

//   const [tManage, tRentForm] = await Promise.all([
//     getTranslations({ locale: resolvedLocale, namespace: 'RentManage' }),
//     getTranslations({ locale: resolvedLocale, namespace: 'RentForm' }),
//   ]);

//   const rent = await prisma.rentRequest.findUnique({
//     where: { id },
//     select: {
//       id: true,
//       humanId: true,
//       status: true,
//       contactName: true,
//       contactEmail: true,
//       contactPhone: true,
//       rentalStart: true,
//       rentalEnd: true,
//       carId: true,
//       updated: true,
//       payload: true,
//       quoteId: true,
//     },
//   });

//   if (!rent) {
//     notFound();
//   }

//   const payload = isRentPayload(rent.payload) ? rent.payload : null;
//   const carId = rent.carId ?? payload?.carId ?? null;
//   const car = carId ? await getCarById(carId) : null;
//   const carName = car
//     ? `${car.manufacturer} ${car.model}`.trim()
//     : payload?.carId ?? 'n/a';

//   const contactName = payload?.contact?.name ?? rent.contactName ?? 'n/a';
//   const contactEmail = payload?.contact?.email ?? rent.contactEmail ?? 'n/a';
//   const contactPhone = payload?.driver?.[0]?.phoneNumber ?? rent.contactPhone;
//   const driverPhone =
//     payload?.driver?.[0]?.phoneNumber ?? rent.contactPhone ?? '';
//   const arrivalFlight = payload?.delivery?.arrivalFlight ?? 'n/a';
//   const departureFlight = payload?.delivery?.departureFlight ?? 'n/a';
//   const period = `${formatFriendlyDate(
//     rent.rentalStart ?? payload?.rentalPeriod?.startDate,
//     resolvedLocale
//   )} → ${formatFriendlyDate(
//     rent.rentalEnd ?? payload?.rentalPeriod?.endDate,
//     resolvedLocale
//   )}`;

//   const statusLabel = getStatusLabel(tManage, rent.status as RequestStatus);

//   const contactDefaults = {
//     name: contactName !== 'n/a' ? contactName : '',
//     email: contactEmail !== 'n/a' ? contactEmail : '',
//     phone: contactPhone ?? '',
//     driverPhone,
//   };

//   const travelDefaults = {
//     arrival: arrivalFlight !== 'n/a' ? arrivalFlight : '',
//     departure: departureFlight !== 'n/a' ? departureFlight : '',
//   };

//   const invoiceDefaults = {
//     name: payload?.invoice?.name ?? payload?.contact?.name ?? '',
//     email: payload?.invoice?.email ?? payload?.contact?.email ?? '',
//     phone: payload?.invoice?.phoneNumber ?? '',
//   };

//   const alertMessage =
//     actionResult === 'cancelled'
//       ? tManage('alerts.cancelSuccess')
//       : actionResult === 'modified'
//       ? tManage('alerts.modifySuccess')
//       : actionResult === 'error'
//       ? tManage('alerts.error')
//       : null;

//   return (
//     <section className='relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 lg:pt-36 pb-20 space-y-10'>
//       <div className='text-center space-y-4'>
//         <p className='text-xs uppercase tracking-[0.6em] text-slate-500 dark:text-slate-300'>
//           {tManage('meta.kicker')}
//         </p>
//         <h1 className='text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wide bg-linear-to-r from-sky-dark/90 to-amber-dark/80 bg-clip-text text-transparent'>
//           {tManage('title')}
//         </h1>
//         <p className='text-base md:text-lg text-grey-dark-3 dark:text-grey-dark-2 max-w-3xl mx-auto'>
//           {tManage('description')}
//         </p>
//       </div>

//       {alertMessage ? (
//         <div className='rounded-2xl border border-amber-500/30 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-50'>
//           {alertMessage}
//         </div>
//       ) : null}

//       <div className='grid gap-8 lg:grid-cols-[1fr,1.4fr]'>
//         <div className='rounded-3xl border border-grey-light-2/60 dark:border-grey-dark-2/50 bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-6'>
//           <div>
//             <h2 className='text-sm uppercase tracking-[0.4em] text-sky-dark dark:text-amber-light'>
//               {tManage('summary.heading')}
//             </h2>
//             <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>
//               {carName}
//             </p>
//           </div>
//           <dl className='space-y-4 text-sm text-grey-dark-3 dark:text-grey-dark-2'>
//             <SummaryRow
//               label={tManage('summary.bookingId')}
//               value={rent.humanId ?? rent.id}
//             />
//             <SummaryRow label={tManage('summary.status')} value={statusLabel} />
//             <SummaryRow label={tManage('summary.period')} value={period} />
//             <SummaryRow
//               label={tManage('summary.contactEmail')}
//               value={contactEmail}
//             />
//             <SummaryRow
//               label={tManage('summary.contactPhone')}
//               value={contactPhone ?? 'n/a'}
//             />
//             <SummaryRow
//               label={tManage('summary.arrivalFlight')}
//               value={normalizeRowValue(arrivalFlight)}
//             />
//             <SummaryRow
//               label={tManage('summary.departureFlight')}
//               value={normalizeRowValue(departureFlight)}
//             />
//           </dl>
//         </div>
//         <div className='space-y-8'>
//           <ContactUpdateForm
//             locale={resolvedLocale}
//             rentId={rent.id}
//             defaults={contactDefaults}
//             tManage={tManage}
//             tRentForm={tRentForm}
//             actionParam={actionParam}
//           />
//           <TravelUpdateForm
//             locale={resolvedLocale}
//             rentId={rent.id}
//             defaults={travelDefaults}
//             tManage={tManage}
//             tRentForm={tRentForm}
//             actionParam={actionParam}
//           />
//           <InvoiceUpdateForm
//             locale={resolvedLocale}
//             rentId={rent.id}
//             defaults={invoiceDefaults}
//             tManage={tManage}
//             tRentForm={tRentForm}
//             actionParam={actionParam}
//           />
//           <CancelForm locale={resolvedLocale} rentId={rent.id} t={tManage} />
//         </div>
//       </div>
//     </section>
//   );
// }

// function SummaryRow({ label, value }: { label: string; value: string }) {
//   return (
//     <div className='flex flex-col gap-1'>
//       <dt className='text-xs uppercase tracking-[0.4em] text-grey-dark-3/70 dark:text-grey-dark-2/70'>
//         {label}
//       </dt>
//       <dd className='text-base font-medium text-slate-900 dark:text-white'>
//         {value}
//       </dd>
//     </div>
//   );
// }

// type TranslationFn = Awaited<ReturnType<typeof getTranslations>>;

// type ContactDefaults = {
//   name: string;
//   email: string;
//   phone: string;
//   driverPhone: string;
// };

// function ContactUpdateForm({
//   locale,
//   rentId,
//   defaults,
//   tManage,
//   tRentForm,
//   actionParam,
// }: {
//   locale: string;
//   rentId: string;
//   defaults: ContactDefaults;
//   tManage: TranslationFn;
//   tRentForm: TranslationFn;
//   actionParam?: string;
// }) {
//   const isActive = actionParam === 'contact';
//   return (
//     <form
//       action={updateRentDetailsAction}
//       className={cn(
//         'rounded-3xl border bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-5',
//         isActive
//           ? 'border-sky-dark/70 dark:border-sky-light/70 shadow-lg shadow-sky-dark/10'
//           : 'border-grey-light-2/60 dark:border-grey-dark-2/50'
//       )}
//     >
//       <div>
//         <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
//           {tRentForm('sections.contact.title')}
//         </h3>
//         <p className='mt-1 text-sm text-grey-dark-3 dark:text-grey-dark-2'>
//           {tManage('modify.description')}
//         </p>
//       </div>
//       <input type='hidden' name='rentId' value={rentId} />
//       <input type='hidden' name='locale' value={locale} />
//       <input type='hidden' name='section' value='contact' />
//       <div className='grid gap-4 md:grid-cols-2'>
//         <div className='space-y-2'>
//           <label
//             htmlFor='contact-name'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.contact.fields.name.label')}
//           </label>
//           <Input
//             id='contact-name'
//             name='contactName'
//             defaultValue={defaults.name}
//             placeholder={tRentForm('sections.contact.fields.name.placeholder')}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='contact-email'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.contact.fields.email.label')}
//           </label>
//           <Input
//             id='contact-email'
//             name='contactEmail'
//             type='email'
//             defaultValue={defaults.email}
//             required
//             placeholder={tRentForm('sections.contact.fields.email.placeholder')}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='contact-phone'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tManage('summary.contactPhone')}
//           </label>
//           <Input
//             id='contact-phone'
//             name='contactPhone'
//             defaultValue={defaults.phone}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='driver-phone'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.drivers.fields.phoneNumber.label')}
//           </label>
//           <Input
//             id='driver-phone'
//             name='driverPhone'
//             defaultValue={defaults.driverPhone}
//           />
//         </div>
//       </div>
//       <Button
//         type='submit'
//         className='rounded-full bg-sky-dark px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-sky-dark/90 dark:bg-sky-light dark:text-slate-900 dark:hover:bg-sky-light/90'
//       >
//         {tManage('modify.button')}
//       </Button>
//     </form>
//   );
// }

// type TravelDefaults = {
//   arrival: string;
//   departure: string;
// };

// function TravelUpdateForm({
//   locale,
//   rentId,
//   defaults,
//   tManage,
//   tRentForm,
//   actionParam,
// }: {
//   locale: string;
//   rentId: string;
//   defaults: TravelDefaults;
//   tManage: TranslationFn;
//   tRentForm: TranslationFn;
//   actionParam?: string;
// }) {
//   const isActive = actionParam === 'travel';
//   return (
//     <form
//       action={updateRentDetailsAction}
//       className={cn(
//         'rounded-3xl border bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-5',
//         isActive
//           ? 'border-amber-dark/70 dark:border-amber-light/70 shadow-lg shadow-amber-dark/10'
//           : 'border-grey-light-2/60 dark:border-grey-dark-2/50'
//       )}
//     >
//       <div>
//         <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
//           {tRentForm('sections.delivery.title')}
//         </h3>
//         <p className='mt-1 text-sm text-grey-dark-3 dark:text-grey-dark-2'>
//           {tRentForm('sections.delivery.description')}
//         </p>
//       </div>
//       <input type='hidden' name='rentId' value={rentId} />
//       <input type='hidden' name='locale' value={locale} />
//       <input type='hidden' name='section' value='travel' />
//       <div className='grid gap-4 md:grid-cols-2'>
//         <div className='space-y-2'>
//           <label
//             htmlFor='travel-arrival'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.delivery.fields.arrivalFlight.label')}
//           </label>
//           <Input
//             id='travel-arrival'
//             name='arrivalFlight'
//             defaultValue={defaults.arrival}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='travel-departure'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.delivery.fields.departureFlight.label')}
//           </label>
//           <Input
//             id='travel-departure'
//             name='departureFlight'
//             defaultValue={defaults.departure}
//           />
//         </div>
//       </div>
//       <Button
//         type='submit'
//         className='rounded-full bg-amber-dark px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-amber-dark/90 dark:bg-amber-light dark:text-slate-900 dark:hover:bg-amber-light/90'
//       >
//         {tManage('modify.button')}
//       </Button>
//     </form>
//   );
// }

// type InvoiceDefaults = {
//   name: string;
//   email: string;
//   phone: string;
// };

// function InvoiceUpdateForm({
//   locale,
//   rentId,
//   defaults,
//   tManage,
//   tRentForm,
//   actionParam,
// }: {
//   locale: string;
//   rentId: string;
//   defaults: InvoiceDefaults;
//   tManage: TranslationFn;
//   tRentForm: TranslationFn;
//   actionParam?: string;
// }) {
//   const isActive = actionParam === 'invoice';
//   return (
//     <form
//       action={updateRentDetailsAction}
//       className={cn(
//         'rounded-3xl border bg-white/90 dark:bg-slate-900/40 backdrop-blur p-6 shadow-sm space-y-5',
//         isActive
//           ? 'border-emerald-500/70 shadow-lg shadow-emerald-500/10'
//           : 'border-grey-light-2/60 dark:border-grey-dark-2/50'
//       )}
//     >
//       <div>
//         <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
//           {tRentForm('sections.invoice.title')}
//         </h3>
//         <p className='mt-1 text-sm text-grey-dark-3 dark:text-grey-dark-2'>
//           {tRentForm('sections.invoice.description')}
//         </p>
//       </div>
//       <input type='hidden' name='rentId' value={rentId} />
//       <input type='hidden' name='locale' value={locale} />
//       <input type='hidden' name='section' value='invoice' />
//       <div className='grid gap-4 md:grid-cols-2'>
//         <div className='space-y-2 md:col-span-2'>
//           <label
//             htmlFor='invoice-name'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.invoice.fields.name.label')}
//           </label>
//           <Input
//             id='invoice-name'
//             name='invoiceName'
//             defaultValue={defaults.name}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='invoice-email'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.invoice.fields.email.label')}
//           </label>
//           <Input
//             id='invoice-email'
//             name='invoiceEmail'
//             type='email'
//             defaultValue={defaults.email}
//           />
//         </div>
//         <div className='space-y-2'>
//           <label
//             htmlFor='invoice-phone'
//             className='text-sm font-medium text-slate-800 dark:text-slate-100'
//           >
//             {tRentForm('sections.invoice.fields.phoneNumber.label')}
//           </label>
//           <Input
//             id='invoice-phone'
//             name='invoicePhone'
//             defaultValue={defaults.phone}
//           />
//         </div>
//       </div>
//       <Button
//         type='submit'
//         className='rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-emerald-600/90'
//       >
//         {tManage('modify.button')}
//       </Button>
//     </form>
//   );
// }

// function CancelForm({
//   locale,
//   rentId,
//   t,
// }: {
//   locale: string;
//   rentId: string;
//   t: Awaited<ReturnType<typeof getTranslations>>;
// }) {
//   return (
//     <form action={cancelRentAction} className='space-y-4'>
//       <div>
//         <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
//           {t('cancel.title')}
//         </h3>
//         <p className='mt-2 text-sm text-grey-dark-3 dark:text-grey-dark-2'>
//           {t('cancel.description')}
//         </p>
//       </div>

//       <input type='hidden' name='rentId' value={rentId} />
//       <input type='hidden' name='locale' value={locale} />
//       <div className='space-y-2'>
//         <label
//           htmlFor='cancel-reason'
//           className='text-sm font-medium text-slate-800 dark:text-slate-100'
//         >
//           {t('cancel.reasonLabel')}
//         </label>
//         <Textarea
//           id='cancel-reason'
//           name='reason'
//           placeholder={t('cancel.reasonPlaceholder')}
//           className='min-h-[120px] resize-none'
//         />
//         <p className='text-xs text-grey-dark-3 dark:text-grey-dark-2'>
//           {t('cancel.helper')}
//         </p>
//       </div>
//       <Button
//         type='submit'
//         className='w-full md:w-auto rounded-full bg-sky-dark px-6 py-2 text-sm font-semibold tracking-[0.3em] text-white hover:bg-sky-dark/90 dark:bg-sky-light dark:text-slate-900 dark:hover:bg-sky-light/90'
//       >
//         {t('cancel.button')}
//       </Button>
//     </form>
//   );
// }

// function getStatusLabel(
//   t: Awaited<ReturnType<typeof getTranslations>>,
//   status: RequestStatus
// ) {
//   switch (status) {
//     case 'new':
//       return t('status.new');
//     case 'in_progress':
//       return t('status.inProgress');
//     case 'answered':
//       return t('status.answered');
//     case 'closed':
//     default:
//       return t('status.closed');
//   }
// }

// const isRentPayload = (value: unknown): value is RentFormValues => {
//   if (!value || typeof value !== 'object') return false;
//   const candidate = value as Record<string, unknown>;
//   return (
//     'contact' in candidate &&
//     'driver' in candidate &&
//     'rentalPeriod' in candidate
//   );
// };

// const formatFriendlyDate = (
//   value: Date | string | null | undefined,
//   locale: string
// ): string => {
//   if (!value) return 'n/a';
//   const parsed = value instanceof Date ? value : new Date(value);
//   if (Number.isNaN(parsed.getTime())) {
//     return typeof value === 'string' ? value : 'n/a';
//   }
//   return parsed.toLocaleDateString(locale, {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   });
// };

// const normalizeRowValue = (value?: string | null): string => {
//   if (typeof value === 'string') {
//     const trimmed = value.trim();
//     return trimmed.length > 0 ? trimmed : 'n/a';
//   }
//   return 'n/a';
// };

// async function cancelRentAction(formData: FormData) {
//   'use server';

//   const rentId = formData.get('rentId');
//   const locale = resolveLocale(String(formData.get('locale') ?? 'hu'));
//   const reason = String(formData.get('reason') ?? '').trim();

//   if (typeof rentId !== 'string' || !RENT_ID_REGEX.test(rentId)) {
//     redirect(`/${locale}/rent/manage/${rentId}?action=cancel&result=error`);
//   }

//   const rent = await prisma.rentRequest.findUnique({
//     where: { id: rentId },
//     select: {
//       id: true,
//       humanId: true,
//       contactName: true,
//       contactEmail: true,
//       status: true,
//     },
//   });

//   if (!rent) {
//     redirect(`/${locale}/rent/manage/${rentId}?action=cancel&result=error`);
//   }

//   const updatedStatusNote = reason
//     ? `cancelled: ${reason}`
//     : 'tenant-cancelled';

//   await prisma.rentRequest.update({
//     where: { id: rentId },
//     data: {
//       status: STATUS_DONE,
//       updated: updatedStatusNote,
//     },
//   });

//   await recordNotification({
//     type: 'rent_request',
//     title: 'Bérlés lemondva',
//     description: `${rent.contactName} (${rent.contactEmail}) lemondta a foglalást.`,
//     href: `/${rentId}`,
//     tone: 'warning',
//     referenceId: rent.id,
//     metadata: {
//       rentId,
//       humanId: rent.humanId,
//       previousStatus: rent.status,
//       reason: reason || null,
//     },
//   });

//   await sendMail({
//     to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
//     subject: `Rent cancellation | ${rent.contactName}`,
//     text: [
//       `Booking ID: ${rent.id}`,
//       `Name: ${rent.contactName}`,
//       `Email: ${rent.contactEmail}`,
//       `Reason: ${reason || 'n/a'}`,
//     ].join('\n'),
//   });

//   revalidatePath(`/${locale}/rent/manage/${rentId}`);
//   redirect(`/${locale}/rent/manage/${rentId}?action=cancel&result=cancelled`);
// }

// async function updateRentDetailsAction(formData: FormData) {
//   'use server';

//   const rentId = formData.get('rentId');
//   const locale = resolveLocale(String(formData.get('locale') ?? 'hu'));
//   const section = String(formData.get('section') ?? '').trim();

//   if (typeof rentId !== 'string' || !RENT_ID_REGEX.test(rentId)) {
//     redirect(`/${locale}/rent/manage/${rentId}?result=error`);
//   }

//   const allowedSections = new Set(['contact', 'travel', 'invoice']);
//   if (!allowedSections.has(section)) {
//     redirect(`/${locale}/rent/manage/${rentId}?result=error`);
//   }

//   const rent = await prisma.rentRequest.findUnique({
//     where: { id: rentId },
//     select: {
//       id: true,
//       humanId: true,
//       contactName: true,
//       contactEmail: true,
//       contactPhone: true,
//       payload: true,
//     },
//   });

//   if (!rent) {
//     redirect(`/${locale}/rent/manage/${rentId}?result=error`);
//   }

//   let updatedPayload: RentFormValues | null = null;
//   if (rent.payload && typeof rent.payload === 'object') {
//     try {
//       updatedPayload = JSON.parse(
//         JSON.stringify(rent.payload)
//       ) as RentFormValues;
//     } catch {
//       updatedPayload = null;
//     }
//   }

//   const summaryLines: string[] = [];
//   const dataPatch: Record<string, string | null> = {};

//   if (section === 'contact') {
//     const name = String(formData.get('contactName') ?? '').trim();
//     const email = String(formData.get('contactEmail') ?? '').trim();
//     const contactPhone = String(formData.get('contactPhone') ?? '').trim();
//     const driverPhone = String(formData.get('driverPhone') ?? '').trim();

//     if (name) {
//       dataPatch.contactName = name;
//       summaryLines.push(`Contact name: ${name}`);
//     }
//     if (email) {
//       dataPatch.contactEmail = email;
//       summaryLines.push(`Contact email: ${email}`);
//     }
//     dataPatch.contactPhone = driverPhone || contactPhone || rent.contactPhone;
//     summaryLines.push(`Phone: ${dataPatch.contactPhone ?? 'n/a'}`);

//     if (updatedPayload) {
//       updatedPayload.contact = updatedPayload.contact ?? {
//         same: false,
//         name: '',
//         email: '',
//       };
//       if (name) {
//         updatedPayload.contact.name = name;
//       }
//       if (email) {
//         updatedPayload.contact.email = email;
//       }
//       if (driverPhone || contactPhone) {
//         updatedPayload.driver = updatedPayload.driver ?? [];
//         if (!updatedPayload.driver[0]) {
//           updatedPayload.driver[0] = {
//             firstName_1: '',
//             lastName_1: '',
//             location: {
//               country: '',
//               postalCode: '',
//               city: '',
//               street: '',
//               doorNumber: '',
//             },
//             dateOfBirth: '',
//             placeOfBirth: '',
//             nameOfMother: '',
//             phoneNumber: driverPhone || contactPhone,
//             email: email || updatedPayload.contact.email,
//             document: {
//               type: 'passport',
//               number: '',
//               validFrom: '',
//               validUntil: '',
//               drivingLicenceNumber: '',
//               drivingLicenceValidFrom: '',
//               drivingLicenceValidUntil: '',
//               drivingLicenceCategory: 'B',
//               drivingLicenceIsOlderThan_3: false,
//             },
//           };
//         } else {
//           updatedPayload.driver[0].phoneNumber = driverPhone || contactPhone;
//           if (email) {
//             updatedPayload.driver[0].email = email;
//           }
//         }
//       }
//     }
//   }

//   if (section === 'travel') {
//     const arrivalFlight = String(formData.get('arrivalFlight') ?? '').trim();
//     const departureFlight = String(
//       formData.get('departureFlight') ?? ''
//     ).trim();
//     summaryLines.push(`Arrival flight: ${arrivalFlight || 'n/a'}`);
//     summaryLines.push(`Departure flight: ${departureFlight || 'n/a'}`);
//     if (updatedPayload) {
//       updatedPayload.delivery = updatedPayload.delivery ?? {};
//       updatedPayload.delivery.arrivalFlight = arrivalFlight || undefined;
//       updatedPayload.delivery.departureFlight = departureFlight || undefined;
//     }
//   }

//   if (section === 'invoice') {
//     const invoiceName = String(formData.get('invoiceName') ?? '').trim();
//     const invoiceEmail = String(formData.get('invoiceEmail') ?? '').trim();
//     const invoicePhone = String(formData.get('invoicePhone') ?? '').trim();

//     summaryLines.push(`Invoice name: ${invoiceName || 'n/a'}`);
//     summaryLines.push(`Invoice email: ${invoiceEmail || 'n/a'}`);
//     summaryLines.push(`Invoice phone: ${invoicePhone || 'n/a'}`);

//     if (updatedPayload) {
//       updatedPayload.invoice = updatedPayload.invoice ?? {
//         same: false,
//         name: '',
//         email: '',
//         phoneNumber: '',
//         location: {
//           country: '',
//           postalCode: '',
//           city: '',
//           street: '',
//           doorNumber: '',
//         },
//       };
//       if (invoiceName) {
//         updatedPayload.invoice.name = invoiceName;
//       }
//       if (invoiceEmail) {
//         updatedPayload.invoice.email = invoiceEmail;
//       }
//       if (invoicePhone) {
//         updatedPayload.invoice.phoneNumber = invoicePhone;
//       }
//     }
//   }

//   const fallbackPayload =
//     rent.payload as
//       | Prisma.InputJsonValue
//       | Prisma.NullableJsonNullValueInput
//       | null
//       | undefined;
//   const payloadToPersist:
//     | Prisma.InputJsonValue
//     | Prisma.NullableJsonNullValueInput = updatedPayload
//     ? (JSON.parse(JSON.stringify(updatedPayload)) as Prisma.InputJsonValue)
//     : fallbackPayload ?? Prisma.JsonNull;

//   try {
//     await prisma.rentRequest.update({
//       where: { id: rentId },
//       data: {
//         ...dataPatch,
//         payload: payloadToPersist,
//         updated: `self-service:${section}`,
//       },
//     });
//   } catch (error) {
//     console.error('Failed to update rent request', error);
//     redirect(`/${locale}/rent/manage/${rentId}?action=${section}&result=error`);
//   }

//   await sendMail({
//     to: process.env.MAIL_USER || 'info@zodiacsrentacar.com',
//     subject: `Booking updated | ${rent.contactName}`,
//     text: [
//       `Booking ID: ${rent.id}`,
//       `Section: ${section}`,
//       ...summaryLines,
//     ].join('\n'),
//   });

//   await recordNotification({
//     type: 'rent_request',
//     title: 'Bérlés frissítve',
//     description: `Az ügyfél frissítette a(z) ${section} adatokat.`,
//     href: `/${rentId}`,
//     tone: 'info',
//     referenceId: rent.id,
//     metadata: {
//       rentId,
//       humanId: rent.humanId,
//       section,
//     },
//   });

//   revalidatePath(`/${locale}/rent/manage/${rentId}`);
//   redirect(
//     `/${locale}/rent/manage/${rentId}?action=${section}&result=modified`
//   );
// }

import React from 'react';

export default function page() {
  return <div>page</div>;
}
