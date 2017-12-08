var io = require('socket.io');
var fs = require('fs');
var http = require('http');
var url = require('url');

var genre_path = 'src/data/genre.json';

var server = http.createServer(function(request, response){
    var path = url.parse(request.url).pathname;
    if (path == '/') {
        fs.readFile(__dirname + "/index.html", function(err, data){
            getResponse(response,err,data,'html');
        });
    } else if(path.indexOf('.jpg') != -1) {
        fs.readFile(__dirname + "/src/img/" + path,function(err,data){
            getResponse(response,err,data,'jpg');
        });
    } else if(path.indexOf('.css') != -1) {
        fs.readFile(__dirname + "/src/css/" + path,function(err,data){
            getResponse(response,err,data,'css');
        });
    } else if(path.indexOf('.png') != -1) {
        fs.readFile(__dirname + "/src/img/" + path,function(err,data){
            getResponse(response,err,data,'png');
        });
    } else if(path.indexOf('.js') != -1) {
        fs.readFile(__dirname + "/src/js/" + path,function(err,data){
            getResponse(response,err,data,'js');
        });
    } else {
        response.writeHead(404);
        response.write("opps this doesn't exist - 404");
        response.end();
    }
});

/**
 * Server starts here
 */

server.listen(8002);

var listener = io.listen(server);

var codes = [];
var genres = [];
listener.sockets.on('connection', function(socket) {
	var genre_str = fs.readFileSync(genre_path);
	var genre_obj = JSON.parse(genre_str.toString());
	if(codes.length==0){
		genre_obj['genres'].forEach(function(e){
			console.log(e);
			codes.push(e.id);
			genres.push(e.name);
		});
	}
	
	socket.emit('genre',{
		genres:genres,
		codes:codes
	});
	
	socket.on('genre',function(data){
        var code = data.code;
        var genre_name = data.name;
		query(socket,code,genre_name,1);
	});

    socket.on('more',function(data){
        var genre = data.genre;
        var page = data.page;
        var this_code;
        genres.forEach(function(e,i){
            if(e==genre){
                console.log("Found:"+codes[i]);
                this_code = codes[i];
            }
        });
        console.log("MORE:"+this_code);
        query(socket,this_code,genre,page);
    });
});

function getResponse(response,err,data,type){
    if (err) {
        response.writeHead(404);
        response.write("opps this doesn't exist - 404");
        response.end();
    } else {
        if (type == "js" || type == "css" || type == "html") {
            response.writeHead(200, {"Content-Type": "text/"+type});
        }
        else if(type=="jpg"){
            response.writeHead(200, {"Content-Type": "image/jpeg"});
        }
        else if(type=="png"){
            response.writeHead(200, {"Content-Type": "image/png"});
        }
        response.write(data, "utf8");
        response.end();
    }
}

function query(socket,code,genre_name,page){
    // console.log("CODE:"+code);
    // console.log("Page:"+page);
    var options = {
        "method": "GET",
        "hostname": "api.themoviedb.org",
        "port": null,
        "path": "/3/genre/"+code+"/movies?sort_by=created_at.asc&include_adult=false&language=en-US&api_key=fca45c53935c767a8c764b056f466027&page="+page,
        "headers": {}
    };

    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            var obj = JSON.parse(body.toString());
            // console.log(obj['total_pages'])
            socket.emit('movies',{
                results:obj['results'],
                genre:genre_name
            });
        });
    });

    req.write("{}");
    req.end();
}

function findCode(genre){
    // console.log(genre);
    
}




