// let id = "12345";
// let hostname = "default-hostname";
// let port = "default-port";

if (id === "") {
  console.error(' _comet_request_1({"success":false,"message":"system error"})');
  process.exit(1);
}

// Check id and update hostname and port accordingly
if (id === "key123456") {
  hostname = "wazobia";
  port = "8333";
} else if (id === "key789012") {
  hostname = "new-hostname-2";
  port = "new-port-2";
} else if (id === "key345678") {
  hostname = "new-hostname-3";
  port = "new-port-3";
}
// Add more conditions as needed...

module.exports = { id, hostname, port };
