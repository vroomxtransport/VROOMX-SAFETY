import { Helmet } from 'react-helmet-async';

export default function SEO({ title, description, path = '/' }) {
  const baseUrl = 'https://vroomxsafety.com';
  const fullTitle = title
    ? `${title} | VroomX Safety`
    : 'VroomX Safety - FMCSA Compliance Management';

  const defaultDescription = 'VroomX Safety helps trucking companies manage FMCSA compliance, track CSA scores, monitor driver qualifications, and stay DOT-ready with automated alerts and reporting.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={`${baseUrl}${path}`} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={`${baseUrl}${path}`} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
    </Helmet>
  );
}
