const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if ('IPv4' !== iface.family || iface.internal) {
                continue;
            }
            return iface.address;
        }
    }
    return '127.0.0.1';
}

const ip = getLocalIP();
console.log(`Detected Local IP: ${ip}`);

const configContent = `[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext
x509_extensions = v3_req

[dn]
C = US
ST = State
L = City
O = Organization
OU = Department
CN = visittrack.local

[req_ext]
subjectAltName = @alt_names

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = visittrack.local
IP.1 = 127.0.0.1
IP.2 = ${ip}
`;

fs.writeFileSync('openssl.cnf', configContent);

try {
    console.log('Generating SSL certificates...');
    execSync('openssl req -x509 -new -nodes -sha256 -utf8 -days 3650 -newkey rsa:2048 -keyout local.key -out local.crt -config openssl.cnf');
    console.log('Certificates generated successfully: local.crt, local.key');
} catch (error) {
    console.error('Error generating certificates:', error.message);
} finally {
    if (fs.existsSync('openssl.cnf')) {
        fs.unlinkSync('openssl.cnf');
    }
}
