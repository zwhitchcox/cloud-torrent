var os = require('os');
var ifaces = os.networkInterfaces();
for (const ifname in ifaces) {
  if (ifname === "Wi-Fi") {
    const iface = ifaces[ifname].find(iface => !(iface.family !== 'IPv4' || iface.internal !== false))
    console.log(iface.address)
  }
}