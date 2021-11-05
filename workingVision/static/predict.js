(function() {

	var width = 320; 
	var height = 0;

	var streaming = false;

	var video = null;
	var canvas = null;
	var photo = null;

	function startup() {
		video = document.getElementById('video');
		canvas = document.getElementById('canvas');
		photo = document.getElementById('photo');

		navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false
			})
			.then(function(stream) {
				video.srcObject = stream;
				video.play();
			})
			.catch(function(err) {
				console.log("An error occurred: " + err);
			});

		video.addEventListener('canplay', function(ev) {
			if (!streaming) {
				height = video.videoHeight / (video.videoWidth / width);

				if (isNaN(height)) {
					height = width / (4 / 3);
				}

				video.setAttribute('width', width);
				video.setAttribute('height', height);
				canvas.setAttribute('width', width);
				canvas.setAttribute('height', height);
				streaming = true;
			}
		}, false);
		
		window.setInterval(takepicture, 50);
		window.setInterval(update, 51)
	}


	function takepicture() {
		var context = canvas.getContext('2d');
			canvas.width = width;
			canvas.height = height;
			context.drawImage(video, 0, 0, width, height);

			var data = canvas.toDataURL('image/png');
			photo.setAttribute('src', data);

	}

	async function update() {

		let image = $('#photo').get(0);
		
		// Pre-process the image
		console.log( "Loading image..." );
		let tensor = tf.browser.fromPixels(image, 3)
			.resizeNearestNeighbor([224, 224]) // change the image size
			.expandDims()
			.toFloat()
			.reverse(-1); // RGB -> BGR
		let predictions = await model.predict(tensor).data();
		console.log(predictions);
		let top5 = Array.from(predictions)
			.map(function (p, i) { // this is Array.map
				return {
					probability: p,
					className: TARGET_CLASSES[i] // we are selecting the value from the obj
				};
			}).sort(function (a, b) {
				return b.probability - a.probability;
			}).slice(0, 7);
	
		$("#prediction-list").empty();
		top5.forEach(function (p) {
			$("#prediction-list").append(`<li>${p.className}: ${p.probability.toFixed(3)*100}%</li>`);
			});
	
		}

	window.addEventListener('load', startup, false);

})();

let model;
let modelLoaded = false;
$( document ).ready(async function () {
	modelLoaded = false;

    console.log( "Loading model..." );
    model = await tf.loadGraphModel('model/model.json');
    console.log( "Model loaded." );
	
	modelLoaded = true;
});


