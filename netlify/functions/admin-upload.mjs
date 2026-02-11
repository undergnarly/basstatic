// Netlify Function: Upload media file to GitHub repo
// Env vars: GITHUB_TOKEN, ADMIN_PASSWORD, GITHUB_REPO

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await req.formData();
    const password = formData.get('password');
    const file = formData.get('file');
    const filePath = formData.get('path');

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!file || !filePath) {
      return new Response(JSON.stringify({ error: 'File and path required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate path — only allow media/events/* to prevent arbitrary file writes
    if (!filePath.startsWith('media/events/')) {
      return new Response(JSON.stringify({ error: 'Invalid upload path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;

    if (!token || !repo) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    // Check if file exists to get SHA
    const getResp = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'basstatic-admin'
      }
    });

    let sha = null;
    if (getResp.ok) {
      const fileData = await getResp.json();
      sha = fileData.sha;
    }

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const content = btoa(binary);

    const commitBody = {
      message: `Upload ${filePath.split('/').pop()} via admin`,
      content,
      branch: 'main'
    };
    if (sha) commitBody.sha = sha;

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'basstatic-admin'
      },
      body: JSON.stringify(commitBody)
    });

    if (!putResp.ok) {
      const err = await putResp.text();
      return new Response(JSON.stringify({ error: 'GitHub API error', detail: err }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await putResp.json();
    return new Response(JSON.stringify({
      ok: true,
      path: filePath,
      commit: result.commit.sha
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
