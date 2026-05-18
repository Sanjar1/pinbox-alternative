import PublicRatingClient from '@/app/[slug]/client';
import { BRANDS, getVotingTitle } from '@/lib/brands';

type BrandKey = 'kaas' | 'glotok' | 'ruba';

const brandOrder: BrandKey[] = ['kaas', 'glotok', 'ruba'];

const previewStoreNames: Record<BrandKey, string> = {
  kaas: '\u041b\u0430\u0432\u043a\u0430 \u0410\u0432\u0430\u0439\u0445\u043e\u043d',
  glotok: '\u0413\u043b\u043e\u0442\u043e\u043a \u042e\u043d\u0443\u0441\u0430\u0431\u0430\u0434',
  ruba: 'Ruba \u0423\u0440\u0438\u043a\u0437\u043e\u0440',
};

export default async function VotingBrandPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const params = await searchParams;
  const requested = (params.brand ?? 'kaas').toLowerCase() as BrandKey;
  const brandKey: BrandKey = brandOrder.includes(requested) ? requested : 'kaas';
  const brand = BRANDS[brandKey];
  const title = getVotingTitle(brand, previewStoreNames[brandKey]);

  const mockStore = {
    id: `preview-${brand.id}`,
    name: previewStoreNames[brandKey],
  } as { id: string; name: string };

  return (
    <div className="min-h-screen flex flex-col items-center p-4" style={{ background: '#e9e8e4' }}>
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center">
          <PublicRatingClient store={mockStore as never} brand={brand} title={title} />
        </div>
      </div>
    </div>
  );
}
