export default async function handler(req, res) {
    // CORS fix
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    let { url, platform } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // ============ FIX: vt.tiktok.com লিংক কনভার্ট ============
        if (url.includes('vt.tiktok.com')) {
            const response = await fetch(url, {
                method: 'HEAD',
                redirect: 'follow'
            });
            url = response.url;
            platform = 'tiktok';
        }
        
        // ============ TIKTOK ============
        if (platform === 'tiktok' || url.includes('tiktok.com')) {
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const data = await response.json();
            
            if (data.code === 0) {
                return res.json({
                    success: true,
                    platform: 'tiktok',
                    title: data.data.title || 'TikTok Video',
                    thumbnail: data.data.cover,
                    video: data.data.play,
                    hdvideo: data.data.hdplay,
                    author: data.data.author?.nickname || 'TikTok User'
                });
            }
        }
        
        // ============ INSTAGRAM ============
        else if (platform === 'instagram' || url.includes('instagram.com')) {
            const response = await fetch(`https://api.instagramdownloader.net/api/instagram/post?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.url) {
                return res.json({
                    success: true,
                    platform: 'instagram',
                    title: 'Instagram Video',
                    thumbnail: data.thumbnail || '',
                    video: data.url,
                    hdvideo: data.hd_url || data.url
                });
            }
        }
        
        // ============ FACEBOOK ============
        else if (platform === 'facebook' || url.includes('facebook.com') || url.includes('fb.watch')) {
            const response = await fetch(`https://api.vevioz.com/api/button/facebook?url=${encodeURIComponent(url)}`);
            const html = await response.text();
            
            const match = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
            if (match) {
                return res.json({
                    success: true,
                    platform: 'facebook',
                    title: 'Facebook Video',
                    video: match[0],
                    hdvideo: match[0]
                });
            }
        }
        
        return res.json({ success: false, error: 'Video not found' });
        
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
