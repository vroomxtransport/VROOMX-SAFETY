import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, path = '/', image, type = 'website', article }) {
  const baseUrl = 'https://vroomxsafety.com';
  const fullTitle = title
    ? `${title} | VroomX Safety`
    : 'VroomX Safety - FMCSA Compliance Management';

  const defaultDescription = 'VroomX Safety helps trucking companies manage FMCSA compliance, track CSA scores, monitor driver qualifications, and stay DOT-ready with automated alerts and reporting.';

  const jsonLd = article ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description || defaultDescription,
    image: image,
    url: `${baseUrl}${path}`,
    datePublished: article.isoDate,
    dateModified: article.isoDate,
    author: {
      '@type': 'Organization',
      name: 'VroomX Safety',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VroomX Safety',
      url: baseUrl,
    },
  } : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={`${baseUrl}${path}`} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={`${baseUrl}${path}`} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
