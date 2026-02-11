export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // ========= PLATFORM DETECT =========
        let platform = '';
        if (/tiktok\.com|vt\.tiktok\.com/.test(url)) platform = 'tiktok';
        else if (/instagram\.com/.test(url)) platform = 'instagram';
        else if (/facebook\.com|fb\.watch/.test(url)) platform = 'facebook';
        else return res.json({ success: false, error: 'Unsupported URL' });

        // ========= TIKTOK =========
        if (platform === 'tiktok') {

            // vt.tiktok redirect fix
            if (url.includes('vt.tiktok.com')) {
                const head = await fetch(url, { method: 'HEAD', redirect: 'follow' });
                url = head.url;
            }

            // API 1 – tikwm
            try {
                const r1 = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
                const j1 = await r1.json();
                if (j1.code === 0) {
                    return res.json({
                        success: true,
                        platform: 'tiktok',
                        title: j1.data.title,
                        thumbnail: j1.data.cover,
                        video: j1.data.play,
                        hdvideo: j1.data.hdplay
                    });
                }
            } catch {}

            // API 2 – tiklydown
            try {
                const r2 = await fetch(`https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`);
                const j2 = await r2.json();
                if (j2.video?.noWatermark) {
                    return res.json({
                        success: true,
                        platform: 'tiktok',
                        title: j2.title,
                        video: j2.video.noWatermark
                    });
                }
            } catch {}
        }

        // ========= INSTAGRAM =========
        if (platform === 'instagram') {

            // API 1 – ddinstagram
            try {
                const r1 = await fetch(`https://ddinstagram.com/api?url=${encodeURIComponent(url)}`);
                const j1 = await r1.json();
                if (j1.media?.length) {
                    return res.json({
                        success: true,
                        platform: 'instagram',
                        video: j1.media[0].url
                    });
                }
            } catch {}

            // API 2 – snapsave (fallback)
            try {
                const r2 = await fetch(`https://snapsave.app/action.php?url=${encodeURIComponent(url)}`);
                const t2 = await r2.text();
                if (t2.includes('download')) {
                    return res.json({
                        success: true,
                        platform: 'instagram',
                        raw: t2
                    });
                }
            } catch {}
        }

        // ========= FACEBOOK =========
        if (platform === 'facebook') {

            // API 1 – fdown
            try {
                const r1 = await fetch(`https://fdown.net/download.php?URL=${encodeURIComponent(url)}`);
                const t1 = await r1.text();
                if (t1.includes('.mp4')) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        raw: t1
                    });
                }
            } catch {}

            // API 2 – snapsave
            try {
                const r2 = await fetch(`https://snapsave.app/action.php?url=${encodeURIComponent(url)}`);
                const t2 = await r2.text();
                if (t2.includes('download')) {
                    return res.json({
                        success: true,
                        platform: 'facebook',
                        raw: t2
                    });
                }
            } catch {}
        }

        return res.json({ success: false, error: 'All APIs failed, try later' });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server error, try again'
        });
    }
}
