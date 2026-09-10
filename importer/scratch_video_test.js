(async () => {
    try {
        const url = 'https://cdn.cartpe.in/images/video_upload/o_1jmdgo6gn1orcp1m1pc53ten008.mp4';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        console.log(`Status: ${res.status}`);
        const buffer = await res.arrayBuffer();
        console.log(`Downloaded bytes: ${buffer.byteLength}`);
    } catch (e) {
        console.error(e);
    }
})();
