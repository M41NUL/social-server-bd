export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    let { url, platform } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    try {
        // Platform detection
        if (url.includes('facebook.com') || url.includes('fb.watch')) platform = 'facebook';
        else if (url.includes('instagram.com')) platform = 'instagram';
        else if (url.includes('tiktok.com') || url.includes('vt.tiktok.com')) platform = 'tiktok';

        // ============ TIKTOK ============
        if (platform === 'tiktok') {
            const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const data = await response.json();
            
            if (data.code === 0) {
                return res.json({
                    success: true,
                    platform: 'tiktok',
                    title: data.data.title || 'TikTok Video',
                    thumbnail: data.data.cover,
                    video: data.data.play,
                    hdvideo: data.data.hdplay
                });
            }
        }
        
        // ============ FACEBOOK ============
        else if (platform === 'facebook') {
            const response = await fetch(`https://fdown.net/download.php?url=${encodeURIComponent(url)}`);
            const html = await response.text();
            const match = html.match(/<a[^>]*href="([^"]*)"[^>]*>Download HD<\/a>/i);
            
            if (match) {
                return res.json({
                    success: true,
                    platform: 'facebook',
                    title: 'Facebook Video',
                    thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
                    video: match[1],
                    hdvideo: match[1]
                });
            }
        }
        
        // ============ INSTAGRAM ============
        else if (platform === 'instagram') {
            const response = await fetch(`https://indown.io/api?url=${encodeURIComponent(url)}`);
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
        
        return res.json({ success: false, error: 'Video not found' });
        
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
