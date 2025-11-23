import fs from 'node:fs';
import path from 'node:path';

import PDFDocument from 'pdfkit';
import type { z } from 'zod';

import { RentSchema } from '@/schemas/RentSchema';

type RentData = z.infer<typeof RentSchema>;
type DeliveryPlaceType = NonNullable<RentData['delivery']>['placeType'];

const EXTRA_LABELS: Record<string, string> = {
  szorfo_deszka_rogzito: 'Szörfdeszka rögzítő',
  gyerekules: 'Gyerekülés',
  kiszallitas: 'Kiszállítás',
  alap_csomag: 'Alap csomag *',
  energia_csomag: 'Energia csomag **',
  esti_erkezes_csomag: 'Esti érkezés csomag ***',
};

const DELIVERY_TYPE_LABELS: Record<
  Exclude<DeliveryPlaceType, undefined>,
  string
> = {
  accommodation: 'Szállás',
  airport: 'Repülőtér',
};

const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'NotoSans-Regular.ttf'
);

const FONT_BOLD_PATH = path.join(
  process.cwd(),
  'public',
  'fonts',
  'NotoSans-Bold.ttf'
);

const localeDateFormatter = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return '—';
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }

  return localeDateFormatter.format(parsed);
}

function formatYesNo(value: boolean | undefined) {
  if (typeof value !== 'boolean') {
    return '—';
  }
  return value ? 'Igen' : 'Nem';
}

function formatOptional(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return '—';
  }
  return String(value);
}

export async function buildRentPdf(data: RentData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];

  if (!fs.existsSync(FONT_REGULAR_PATH)) {
    throw new Error(
      'Hiányzik a PDF generáláshoz szükséges NotoSans-Regular.ttf fájl.'
    );
  }

  if (!fs.existsSync(FONT_BOLD_PATH)) {
    throw new Error(
      'Hiányzik a PDF generáláshoz szükséges NotoSans-Bold.ttf fájl.'
    );
  }

  doc.registerFont('rent-regular', FONT_REGULAR_PATH);
  doc.registerFont('rent-bold', FONT_BOLD_PATH);
  doc.font('rent-regular').fontSize(11);

  doc.on('data', (chunk) => buffers.push(chunk as Buffer));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });

  const addSectionTitle = (title: string) => {
    doc.moveDown();
    doc.font('rent-bold').fontSize(14).text(title);
    doc.moveDown(0.3);
    doc.font('rent-regular').fontSize(11);
  };

  const addField = (label: string, value: string | number) => {
    doc.font('rent-bold').text(`${label}:`, { continued: true });
    doc.font('rent-regular').text(` ${value}`);
  };

  doc.font('rent-bold').fontSize(18).text('Bérlés igény összefoglaló', {
    align: 'center',
  });
  doc.moveDown();
  doc
    .font('rent-regular')
    .fontSize(11)
    .text(`Létrehozva: ${localeDateFormatter.format(new Date())}`);

  addSectionTitle('Bérlés adatai');
  addField('Kezdés dátuma', formatDate(data.rentalPeriod.startDate));
  addField('Zárás dátuma', formatDate(data.rentalPeriod.endDate));
  addField('Felnőttek száma', data.adults);
  addField(
    'Gyermekek száma',
    data.children.length > 0 ? data.children.length : 'Nincs'
  );
  data.children.forEach((child, index) => {
    doc.text(
      `  • Gyermek ${index + 1}: ${child.age} év, magasság: ${
        child.height ? `${child.height} cm` : '—'
      }`
    );
  });

  addField(
    'Extrák',
    data.extras && data.extras.length > 0
      ? data.extras
          .map((extra) => EXTRA_LABELS[extra] ?? extra)
          .join(', ')
      : 'Nincs'
  );

  addSectionTitle('Kapcsolattartó');
  addField('Név', data.contact.name);
  addField('Email', data.contact.email);
  addField('Megegyezik a bérlő adataival', formatYesNo(data.contact.same));

  addSectionTitle('Számlázási adatok');
  addField('Név', data.invoice.name);
  addField('Telefon', data.invoice.phoneNumber);
  addField('Email', data.invoice.email);
  addField(
    'Számlázási cím',
    `${data.invoice.location.postalCode} ${data.invoice.location.city}, ${data.invoice.location.street} ${data.invoice.location.doorNumber}, ${data.invoice.location.country}`
  );
  addField('Megegyezik a bérlő adataival', formatYesNo(data.invoice.same));

  if (data.tax.id || data.tax.companyName) {
    addSectionTitle('Adó / Cégadatok');
    addField('Adószám', formatOptional(data.tax.id));
    addField('Cégnév', formatOptional(data.tax.companyName));
  }

  if (data.delivery) {
    addSectionTitle('Kiszállítás');
    addField(
      'Típus',
      data.delivery.placeType
        ? DELIVERY_TYPE_LABELS[data.delivery.placeType] ??
            data.delivery.placeType
        : '—'
    );
    addField('Hely neve', formatOptional(data.delivery.locationName));
    addField(
      'Érkezési járatszám',
      formatOptional(data.delivery.arrivalFlight)
    );
    addField(
      'Hazautazó járatszám',
      formatOptional(data.delivery.departureFlight)
    );
    const address = data.delivery.address;
    if (address) {
      addField(
        'Cím',
        [
          address.postalCode,
          address.city,
          address.street,
          address.doorNumber,
          address.country,
        ]
          .filter(Boolean)
          .join(' ')
      );
    }
  }

  data.driver.forEach((driver, index) => {
    addSectionTitle(`Vezető ${index + 1}`);
    const fullName = [driver.lastName_1, driver.firstName_1]
      .filter(Boolean)
      .join(' ');
    addField('Név', fullName);
    addField(
      'Születési hely, idő',
      `${driver.placeOfBirth}, ${formatDate(driver.dateOfBirth)}`
    );
    addField('Édesanya neve', formatOptional(driver.nameOfMother));
    addField('Telefon', driver.phoneNumber);
    addField('Email', driver.email);
    addField(
      'Lakóhely',
      `${driver.location.postalCode} ${driver.location.city}, ${driver.location.street} ${driver.location.doorNumber}, ${driver.location.country}`
    );
    addField(
      'Okmánytípus',
      driver.document.type === 'passport' ? 'Útlevél' : 'Személyi igazolvány'
    );
    addField('Okmányszám', driver.document.number);
    addField(
      'Okmány érvényesség',
      `${formatDate(driver.document.validFrom)} - ${formatDate(
        driver.document.validUntil
      )}`
    );
    addField('Jogosítvány száma', driver.document.drivingLicenceNumber);
    addField(
      'Jogosítvány érvényesség',
      `${formatDate(driver.document.drivingLicenceValidFrom)} - ${formatDate(
        driver.document.drivingLicenceValidUntil
      )}`
    );
    addField(
      'Jogosítvány 3 évnél régebbi',
      formatYesNo(driver.document.drivingLicenceIsOlderThan_3)
    );
    addField(
      'Jogosítvány kategória',
      formatOptional(driver.document.drivingLicenceCategory)
    );
  });

  doc.end();

  return done;
}
