import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, path = '/', image, type = 'website', article, breadcrumbs, faqItems }) {
  const baseUrl = 'https://vroomxsafety.com';
  const fullTitle = title
    ? `${title} | VroomX Safety`
    : 'VroomX Safety - FMCSA Compliance Management';

  const defaultDescription = 'VroomX Safety helps trucking companies manage FMCSA compliance, track CSA scores, monitor driver qualifications, and stay DOT-ready with automated alerts and reporting.';

  const blogPostingLd = article ? {
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

  const breadcrumbLd = breadcrumbs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`,
    })),
  } : null;

  const faqLd = faqItems?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
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
      {blogPostingLd && (
        <script type="application/ld+json">
          {JSON.stringify(blogPostingLd)}
        </script>
      )}
      {breadcrumbLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLd)}
        </script>
      )}
      {faqLd && (
        <script type="application/ld+json">
          {JSON.stringify(faqLd)}
        </script>
      )}
    </Helmet>
  );
}
