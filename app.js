import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const mcstatus = require("./mcstatus_api.cjs")
const http = require('http');
var url = require('url');

var htmlContent = ""

http.createServer(async (req, res) => {
    res.setHeader("Content-type", "text/html;charset=utf8");
    var params = url.parse(req.url, true).query;;
    if (params.hostname, params.port != undefined) {

        try {
            var serverInfo = await mcstatus.getServerStatus(params.hostname, params.port);
            switch (params.type){
                case "favicon":
                    htmlContent = serverInfo.favicon
                    break
                case "description":
                    htmlContent = serverInfo.description
                    break
                case "version":
                    htmlContent = serverInfo.version
                    break
                case "preventsChatReports":
                    htmlContent = serverInfo.preventsChatReports
                    break
                case "players":
                    htmlContent = serverInfo.players
                    break
                default:
                    htmlContent = '获取服务器信息失败:未提供type参数'
            }
        } catch (err) {
            htmlContent = '获取服务器信息失败:'+err.message
        }
    }
    
    
    res.write(JSON.stringify(htmlContent))

    res.end()

}).listen(3000);
console.log("Server is running at http://localhost:3000");