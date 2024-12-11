const imageSelect = document.getElementById('image_select');
const imageInput = document.getElementById("image_input");
const imageOutput = document.getElementById("image_output");

var numColors = document.getElementById("numColors");
var lightI = document.getElementById("lightI");
var lightC = document.getElementById("lightC");
var hueI = document.getElementById("hueI");
var hueC = document.getElementById("hueC");
var chromaI = document.getElementById("chromaI");
var chromaC = document.getElementById("chromaC");
var power = document.getElementById("power");
var numColorsOP = document.getElementById("numColorsOP");
var p1 = document.getElementById("p1");
var palName = document.getElementById("palName");
var bayer4x4 = [
    [  0, 8,  2, 10 ],
    [ 12,  4, 14, 6 ],
    [  3, 11,  1, 9 ],
    [ 15, 7, 13,  5 ]
  ];

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
function rgbToHex(c) {
    return componentToHex(c[0]) + "" + componentToHex(c[1]) + "" + componentToHex(c[2]);
}

numColors.oninput = function() {
    numColorsOP.innerHTML = "Number of Colors:" + this.value 
}

function lerp( a, b, alpha ) {
    return a + alpha * ( b - a )
}

function getPaletteColor(level, dither, colors){
	const ind = Math.floor((level + dither) * colors.length);
    const c = Math.min(colors.length - 1, ind)
    return colors[c];
}

function quantize(colors) {
    var imagedata = imageInput.getContext("2d", { willReadFrequently: true }).getImageData(0,0, imageInput.width, imageInput.height)
	const pow = lerp(1, 8, power.value * 0.01)
    
    try {
        for (var i = 0; i <= imagedata.data.length; i += 4) {
            var x = i / 4 % imageInput.width;
            var y = Math.floor(i / 4 / imageInput.width);
            var level = (imagedata.data[i+0] / 255) ** pow // red channel - input image must be grayscale!
			var dither = (1/numColors.value)*(bayer4x4[x % 4][y % 4] * 1/16)
            getColor = getPaletteColor(level, dither, colors)

            imagedata.data[i+0] = getColor[0]
            imagedata.data[i+1] = getColor[1]
            imagedata.data[i+2] = getColor[2]
        }
    }
    catch(e)
    {
        console.log(e);
    }
    imageOutput.getContext("2d").putImageData(imagedata,0,0)
};

function generatePalette() {
	document.body.style.cursor = 'wait';
    p1.innerHTML = "";
    colors = [];
    colorsRGB = [];

    var baseL = lerp(0.0, 1.0, lightI.value * 0.01);
    var changeL = lerp(-baseL, 1.0 - baseL, lightC.value * 0.01);
    var baseC = lerp(0.0, 0.2, chromaI.value * 0.01);
    var changeC = lerp(-baseC, 0.2 - baseC, chromaC.value * 0.01);
    var baseH = 2 * Math.PI * hueI.value * 0.01;
    var changeH = lerp(-1, 1, hueC.value * 0.01);

    for(let i = 0; i < numColors.value; i++) {
        var wheelItr = i / (numColors.value -1);
        
        var L = baseL + wheelItr * changeL;
        var H = baseH + wheelItr * changeH * 2 * Math.PI;
        var C = baseC + wheelItr * changeC;
        var colWrap = document.createElement("div");
        colWrap.classList.add("color");
        colWrap.style.backgroundColor = "oklch("+L+" "+C+" "+H+"rad)";
        var colName = document.createElement("p");
        var curCol = document.createElement("canvas");
        curCol.id = "color"+i;
        curCol.width = "2";
        curCol.height = "2";
        const ctx = curCol.getContext("2d", {willReadFrequently: true});
        ctx.fillStyle = "oklch("+L+" "+C+" "+H+"rad)";
        ctx.fillRect(0, 0, curCol.width, curCol.height);
        colName.innerHTML = "#"+rgbToHex(ctx.getImageData(0, 0, 1, 1).data);
        if(L < .5) {
            colName.style.color = "#ffffff";
        }
        else {
            colName.style.color = "#000000";
        }
        
        colors.push(rgbToHex(ctx.getImageData(0, 0, 1, 1).data));
        colorsRGB.push(ctx.getImageData(0, 0, 1, 1).data);
        colWrap.appendChild(curCol);
        colWrap.appendChild(colName);
        p1.appendChild(colWrap);
    }
    quantize(colorsRGB);
	document.body.style.cursor = 'default';
}

imageSelect.addEventListener('change', handleImageSelection);

function handleImageSelection(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();

    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        imageInput.width = img.width;
        imageInput.height = img.height;
		imageOutput.width = img.width;
		imageOutput.height = img.height;

        const ctx = imageInput.getContext('2d');
        ctx.drawImage(img, 0, 0);
	
		generatePalette();
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  } else {
    alert('Please select a valid image file.');
  }
}