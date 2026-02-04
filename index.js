const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// API lấy danh sách người ở gần trong bán kính X km
app.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 10 } = req.query; // radius mặc định 10km

  const { data, error } = await supabase
    .rpc('get_users_within_radius', { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng), 
      radius_meters: radius * 1000 
    });

  res.json(data);
});

app.listen(3000, () => console.log('Server dating đang chạy!'));