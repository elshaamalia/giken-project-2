require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mqtt = require('mqtt');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);

// Konfigurasi CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// --- Konfigurasi ---
const MQTT_BROKER_URL = process.env.MQTT_BROKER;
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'monitoring';
const PORT = process.env.PORT || 3001;

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'paralel',
  connectionLimit: 10
};

let connectedClients = 0;
let pool;

// Inisialisasi database
async function initDatabase() {
  try {
    pool = mysql.createPool(DB_CONFIG);
    const connection = await pool.getConnection();
    console.log(`✅ Database terkoneksi ke '${DB_CONFIG.database}'`);
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Gagal koneksi database:", err.message);
    return false;
  }
}

// Penanganan koneksi WebSocket
io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 Client terkoneksi. Total clients: ${connectedClients}`);

  // Kirim data awal saat client terhubung
  sendInitialData(socket);

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`🔌 Client disconnect. Total clients: ${connectedClients}`);
  });

  // Menangani permintaan untuk semua data
  socket.on('request-all-data', async () => {
    try {
      const sql = `
        SELECT id, start_time, screw, \`function\`, label, end_time, -- MODIFIKASI: tambah 'label'
               cycle_time, status, output_no, created_at
        FROM \`cycle\` 
        ORDER BY id DESC
      `;
      const [rows] = await pool.execute(sql);
      socket.emit('all-data', rows);
    } catch (err) {
      console.error('Error fetching all data:', err);
      socket.emit('error', 'Failed to fetch data');
    }
  });
});

// Mengirim data awal ke client yang baru terhubung
async function sendInitialData(socket) {
  try {
    // Ambil 5 record terbaru untuk tabel
    const tableSql = `
      SELECT id, start_time, screw, \`function\`, label, end_time, -- MODIFIKASI: tambah 'label'
             cycle_time, status, output_no, created_at
      FROM \`cycle\` 
      ORDER BY id DESC 
      LIMIT 5
    `;
    
    // Ambil statistik
    const statsSql = `
      SELECT 
        COUNT(*) as total_parts,
        AVG(cycle_time) as avg_cycle,
        COUNT(CASE WHEN status = 'Finish' THEN 1 END) as completed_parts,
        COUNT(CASE WHEN status != 'Finish' THEN 1 END) as in_progress
      FROM \`cycle\`
    `;

    // Ambil data chart (10 record terakhir yang selesai)
    const chartSql = `
      SELECT start_time, screw, \`function\`, label, cycle_time, output_no -- MODIFIKASI: tambah 'label'
      FROM \`cycle\` 
      WHERE status = 'Finish' AND cycle_time > 0
      ORDER BY id DESC 
      LIMIT 10
    `;

    const [tableData] = await pool.execute(tableSql);
    const [statsData] = await pool.execute(statsSql);
    const [chartData] = await pool.execute(chartSql);

    // Kirim data awal
    socket.emit('initial-data', {
      recentData: tableData,
      stats: statsData[0] || {},
      chartData: chartData.reverse() // Balik urutan untuk chart
    });

  } catch (err) {
    console.error('Error sending initial data:', err);
  }
}

// Rute API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    clients: connectedClients, 
    timestamp: new Date().toISOString() 
  });
});

app.get('/api/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_parts,
        AVG(cycle_time) as avg_cycle,
        COUNT(CASE WHEN status = 'Finish' THEN 1 END) as completed_parts,
        COUNT(CASE WHEN status != 'Finish' THEN 1 END) as in_progress,
        AVG(screw) as avg_screw,
        AVG(\`function\`) as avg_function,
        AVG(label) as avg_label -- MODIFIKASI: tambah avg_label
      FROM \`cycle\`
    `;
    const [rows] = await pool.execute(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const sql = `
      SELECT id, start_time, screw, \`function\`, label, end_time, -- MODIFIKASI: tambah 'label'
             cycle_time, status, output_no, created_at
      FROM \`cycle\` 
      ORDER BY id DESC 
      LIMIT ?
    `;
    const [rows] = await pool.execute(sql, [parseInt(limit)]);
    res.json(rows);
  } catch (err) {
    console.error('Error getting recent data:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Pengaturan MQTT
async function setupMQTT() {
  console.log(`Connecting to MQTT: ${MQTT_BROKER_URL}...`);
  const client = mqtt.connect(MQTT_BROKER_URL);

  client.on('connect', () => {
    console.log("✅ MQTT Connected");
    client.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log(`📡 Subscribed to topic: '${MQTT_TOPIC}'`);
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      const outputNumber = data.output_number > 0 ? data.output_number : null;

      console.log(`📥 Received: ${data.start_time} | Status: ${data.status} | Output: ${outputNumber || 'N/A'}`);

      // Ambil durasi setiap proses. Jika tidak ada, dianggap 0.
      const screwDuration = parseFloat(data.screw_duration) || 0;
      const functionDuration = parseFloat(data.function_duration) || 0;
      const labelDuration = parseFloat(data.label_duration) || 0;

      // Hitung total durasi berdasarkan semua proses
      const totalDuration = screwDuration + functionDuration + labelDuration;
      
      // Menggunakan cycle_time langsung dari ESP32 jika ada, jika tidak hitung totalnya
      const finalCycleTime = parseFloat(data.cycle_time) || totalDuration;
      

      // Cek apakah record sudah ada
      const checkSql = "SELECT id FROM `cycle` WHERE `start_time` = ?";
      const [rows] = await pool.execute(checkSql, [data.start_time]);

      let recordId;
      let isNewRecord = false;

      if (rows.length > 0) {
        // Update record yang ada
        recordId = rows[0].id;
        // --- MODIFIKASI: Tambah 'label = ?' ---
        const updateSql = `
          UPDATE \`cycle\` SET 
            screw = ?, \`function\` = ?, label = ?, end_time = ?, 
            cycle_time = ?, status = ?, output_no = ?
          WHERE id = ?`;
        
        // --- MODIFIKASI: Tambah 'labelDuration' di parameter ---
        await pool.execute(updateSql, [
          screwDuration,
          functionDuration,
          labelDuration, // <-- Nilai baru untuk kolom label
          data.end_time,
          finalCycleTime,
          data.status,
          outputNumber,
          recordId
        ]);
        
        console.log(`🔄 Updated record ID: ${recordId}`);
      } else {
        // Sisipkan record baru
        isNewRecord = true;
        // --- MODIFIKASI: Tambah kolom 'label' dan '?' ---
        const insertSql = `
          INSERT INTO \`cycle\` (start_time, screw, \`function\`, label, end_time, cycle_time, status, output_no) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        // --- MODIFIKASI: Tambah 'labelDuration' di parameter ---
        const [result] = await pool.execute(insertSql, [
          data.start_time,
          screwDuration,
          functionDuration,
          labelDuration, // <-- Nilai baru untuk kolom label
          data.end_time,
          finalCycleTime,
          data.status,
          outputNumber
        ]);
        
        recordId = result.insertId;
        console.log(`✅ New record inserted ID: ${recordId}`);
      }

      // Broadcast update realtime ke semua client yang terhubung
      const broadcastData = {
        id: recordId,
        start_time: data.start_time,
        screw: screwDuration,
        function: functionDuration,
        label: labelDuration, // --- MODIFIKASI: Tambah properti 'label' ---
        end_time: data.end_time,
        cycle_time: finalCycleTime,
        status: data.status,
        output_no: outputNumber,
        is_new: isNewRecord
      };

      io.emit('realtime-update', broadcastData);

      // Kirim statistik yang sudah diupdate
      const statsSql = `
        SELECT 
          COUNT(*) as total_parts,
          AVG(cycle_time) as avg_cycle,
          COUNT(CASE WHEN status = 'Finish' THEN 1 END) as completed_parts,
          COUNT(CASE WHEN status != 'Finish' THEN 1 END) as in_progress
        FROM \`cycle\`
      `;
      const [statsRows] = await pool.execute(statsSql);
      io.emit('stats-update', statsRows[0]);

    } catch (err) {
      console.error('❌ Error processing MQTT message:', err);
    }
  });

  client.on('error', (err) => console.error("❌ MQTT Error:", err));
}

// Fungsi utama
async function main() {
  const dbOk = await initDatabase();
  if (!dbOk) {
    process.exit(1);
  }

  await setupMQTT();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket ready for connections`);
    console.log(`🔄 MQTT-to-WebSocket bridge active`);
  });
}

// Menangani shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (pool) {
    pool.end();
  }
  process.exit(0);
});

main().catch(console.error);