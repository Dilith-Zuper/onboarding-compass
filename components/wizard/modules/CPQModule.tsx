const BRAND_GBB: Record<string, { good: string; better: string; best: string }> = {
  gaf: {
    good:   'GAF Timberline HDZ — lifetime shingles, leak barrier, starter strips',
    better: 'GAF Timberline HDZ + Cobra ventilation + enhanced underlayment',
    best:   'GAF Timberline UHDZ with full System Plus warranty — all accessories included',
  },
  certainteed: {
    good:   'CertainTeed Landmark — lifetime warranty, StainFighter algae resistance',
    better: 'CertainTeed Landmark Pro + WinterGuard + RoofRunner',
    best:   'CertainTeed Landmark Premium with SureStart PLUS warranty',
  },
  owens_corning: {
    good:   'OC Duration — SureNail Technology, Wind Resistance warranty',
    better: 'OC Duration + WeatherLock + ProArmor underlayment',
    best:   'OC Duration Flex with Preferred Contractor warranty + full system',
  },
  iko: {
    good:   'IKO Cambridge — 30-year limited warranty, algae resistance',
    better: 'IKO Cambridge + IKO ArmourGard + granule-coated cap sheet',
    best:   'IKO Dynasty with ArmourZone Technology + Dynasty Shield',
  },
  tamko: {
    good:   'TAMKO Heritage — 30-year limited warranty, weathering wood',
    better: 'TAMKO Heritage + TW underlayment + starter shingles',
    best:   'TAMKO Heritage Premium with lifetime warranty + full accessory system',
  },
  atlas: {
    good:   'Atlas Pinnacle — 30-year warranty, algae-resistance',
    better: 'Atlas Pinnacle + Summit underlayment + hip/ridge cap',
    best:   'Atlas Pinnacle Pristine with StainGuard Plus + full system',
  },
  boral: {
    good:   'Boral Steel Stone-Coated — Class 4 impact rating, 50-year warranty',
    better: 'Boral Steel + enhanced underlayment + valley flashing',
    best:   'Boral Tile with full manufacturer system and lifetime warranty',
  },
  malarkey: {
    good:   'Malarkey Legacy — 3-tab, SBS modified asphalt, 30-year warranty',
    better: 'Malarkey Vista + rubberised polymer + enhanced underlayment',
    best:   'Malarkey Windsor with NEX polymer technology + full system warranty',
  },
};

const GENERIC_GBB = {
  good:   'Entry-level shingle system with manufacturer limited warranty',
  better: 'Mid-range system with enhanced underlayment and accessories',
  best:   'Premium full system with longest available manufacturer warranty',
};

const TIER_STYLES = [
  { label: 'Good',   labelCls: 'text-gray-500',   borderCls: 'border-[#E5E2DC]' },
  { label: 'Better', labelCls: 'text-blue-600',    borderCls: 'border-blue-200' },
  { label: 'Best',   labelCls: 'text-orange-600',  borderCls: 'border-orange-300' },
];

interface Props {
  selectedBrands: string[];
  saEmail: string;
}

export function CPQModule({ selectedBrands, saEmail }: Props) {
  const onboardingEmail = 'onboarding@zuper.co';
  const brands = selectedBrands.filter((b) => b !== 'other');

  if (!brands.length) {
    return (
      <div className="bg-[#F5F3F0] rounded-2xl px-5 py-4">
        <p className="text-sm text-gray-500">
          No brands selected. Go back to the questions step to select the brands you work with.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-blue-600">
          <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9 8v5M9 6v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-sm text-blue-700">
          These Good / Better / Best proposals will be built in Zuper CPQ before go-live.
          Questions? Reach out to{' '}
          {saEmail && (
            <>
              <a href={`mailto:${saEmail}`} className="underline underline-offset-2">{saEmail}</a>
              {' '}or{' '}
            </>
          )}
          <a href={`mailto:${onboardingEmail}`} className="underline underline-offset-2">{onboardingEmail}</a>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 items-start">
      {brands.map((brandKey) => {
        const gbb = BRAND_GBB[brandKey] || GENERIC_GBB;
        const brandName = brandKey
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        return (
          <div key={brandKey} className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden">
            <div className="px-5 py-3 bg-[#F5F3F0] border-b border-[#E5E2DC]">
              <p className="text-sm font-bold text-[#1A1A1A]">{brandName}</p>
            </div>
            <div className="divide-y divide-[#E5E2DC]">
              {[gbb.good, gbb.better, gbb.best].map((desc, i) => (
                <div key={i} className={`flex gap-4 px-5 py-4 border-l-4 ${TIER_STYLES[i].borderCls}`}>
                  <span className={`text-xs font-bold uppercase tracking-widest w-12 shrink-0 mt-0.5 ${TIER_STYLES[i].labelCls}`}>
                    {TIER_STYLES[i].label}
                  </span>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
