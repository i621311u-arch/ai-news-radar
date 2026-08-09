console.log('Triggering Netlify email digest API...');
fetch('https://ubiquitous-dodol-ec4889.netlify.app/api/admin/digest', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    console.log('NETLIFY RESPONSE:', JSON.stringify(data, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('FETCH ERROR:', err);
    process.exit(1);
  });
