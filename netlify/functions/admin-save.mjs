// Netlify Function: Save events.json to GitHub repo
// Env vars: GITHUB_TOKEN, ADMIN_PASSWORD, GITHUB_REPO (e.g. "user/repo")

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { password, data } = body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'No data provided' }), {
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

    const filePath = 'data/events.json';
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    // Get current file SHA
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

    // Commit updated file
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2) + '\n')));
    const commitBody = {
      message: 'Update events via admin panel',
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
