$( document ).ready(function() {
    $("#play-button").click(execute_simulation);
    $("#stop-button").click(stop);
    window.onresize = display;
});

var data = [];
var interval;
var newgendata = null;
var mutationProb;
var crossoverProb;
var populationSize;
var ideal_sum;
var ideal_product;
var maxGenerations;

function execute_simulation() {
    if (validate() == false)
        return false;
    window.clearInterval(interval);
    data = [];
    newgendata = null;
    
    ideal_sum = parseInt($("#ideal-sum").val());
    ideal_product = parseInt($("#ideal-product").val());
    mutationProb = parseFloat($("#mutation-text").val());
    crossoverProb = parseFloat($("#crossover-text").val());
    populationSize = parseInt($("#population-size-text").val());
    maxGenerations = parseInt($("#max-gen-text").val());
    var population = generate_population(populationSize, parseInt($("#int-size-text").val()));
    scores = eval_scores(population);
    create_first_ring(scores, population);
    
    interval = window.setInterval(update, 32);
}

function mutate(chrom) {
    var out = ["", ""];
    for (i = 0; i < chrom[0].length; i++) {
        out[0] += (chrom[0].charAt(i) == '1' || Math.random() < 0.3 ? "0" : "1");
    }
    for (i = 0; i < chrom[1].length; i++) {
        out[1] += (chrom[1].charAt(i) == '1' || Math.random() < 0.3 ? "0" : "1");
    }
    return out;
}

function crossover(chrom) {
    var out = ["", ""];
    var randombit = parseInt(Math.random() * chrom[0].length) + 1;
    for (i = 0; i < chrom[0].length; i++) {
        if (i >= randombit) {
            out[0] += chrom[1].charAt(i);
            out[1] += chrom[0].charAt(i);
        } else {
            out[0] += chrom[0].charAt(i);
            out[1] += chrom[1].charAt(i);
        }
    }
    return out;
}

function nextgeneration(angle, indexInGeneration, generation) {
    var out;
    var notaccepted = true;
    var indices = [-1, -1];
    var chromdata = ["", ""];
    for (i = 0; i < 2; i++) {
        var index;
        notaccepted = true;
        while (notaccepted){
            index = parseInt(data.length*Math.random());
            if (data[index].generation != generation-1)
                continue;
            if(Math.random()<data[index].score && index != indices[0]) {notaccepted=false;}
        }
        indices[i] = index;
        chromdata[i] = data[index].data;
    }
    
    var chance = Math.random();
    var mutated = false;
    var crossovered = false;
    if (chance < crossoverProb) {
        chromdata = crossover(chromdata);
        crossovered = true;
    }
    if (chance < mutationProb) {
        chromdata = mutate(chromdata);
        mutated = true;
    }
    
    var score1 = eval_score(chromdata[0]);
    var score2 = eval_score(chromdata[1]);
    var solchrom = "";
    if (score1 == 1.0)
        solchrom = chromdata[0];
    if (score2 == 1.0)
        solchrom = chromdata[1];
    if (solchrom != "") {
        
        window.clearInterval(interval);
        var solution = "";
        var opready = false;
        for (i = 0; i < solchrom.length; i++) {
            if (solchrom.charAt(i) != '0')
                continue;
            if (opready) {
                solution += "+"
            }
            solution += "" + (i+1);
            opready = true;
        }
        solution += "=" + ideal_sum + "\n";
        opready = false;
        for (i = 0; i < solchrom.length; i++) {
            if (solchrom.charAt(i) != '1')
                continue;
            if (opready) {
                solution += "x"
                opdone = true;
            }
            solution += "" + (i+1);
            opready = true;
        }
        solution += "=" + ideal_sum + "\n";
        alert("Solution found!\n" + solution);
    }
    var newchrom = {
        radius: 70, 
        angle: angle, 
        score: score1,
        generation: generation,
        data: chromdata[0]
    };
    data.push(newchrom);
    angle += (360.0 / populationSize);
    newchrom = {
        radius: 70, 
        angle: angle, 
        score: score2,
        generation: generation,
        data: chromdata[1]
    };
    data.push(newchrom);
    
    out = {
        indices: indices,
        data: chromdata,
        mutated: mutated,
        crossovered: crossovered,
        starttime: 0,
        angle: angle,
        indexInGeneration: indexInGeneration,
        generation: generation
    };
    return out;
}

function stop() {
    if (data.length < 1)
        return;
    window.clearInterval(interval);
    var lastgen = data[data.length-1].generation;
    var max = 0.0;
    var maxIndex = -1;
    for (i = data.length-1; i >= 0 && data[i].generation == lastgen; i--) {
        if (data[i].score >= max) {
            max = data[i].score;
            maxIndex = i;
        }
    }
    var solution = "";
    var opready = false;
    for (i = 0; i < data[maxIndex].data.length; i++) {
        if (data[maxIndex].data.charAt(i) != '0')
            continue;
        if (opready) {
            solution += "+"
        }
        solution += "" + (i+1);
        opready = true;
    }
    solution += "=" + ideal_sum + "\n";
    opready = false;
    for (i = 0; i < data[maxIndex].data.length; i++) {
        if (data[maxIndex].data.charAt(i) != '1')
            continue;
        if (opready) {
            solution += "x"
            opdone = true;
        }
        solution += "" + (i+1);
        opready = true;
    }
    solution += "=" + ideal_sum + "\n";
    alert("Closest solution (score " + data[maxIndex].score + "):\n" + solution);
}

function update() {
    if (newgendata != null) {
        newgendata.starttime += 32;
        if (newgendata.starttime > 20) {
            if (newgendata.indexInGeneration + 1 >= populationSize)
                newgendata = null;
            else
                newgendata = nextgeneration (newgendata.angle + (360.0 / populationSize), newgendata.indexInGeneration+2, newgendata.generation);
        }
    } else {
        var i = data.length;
        var radiusmin = 900;
        while (i--) {
            if (data[i].radius < radiusmin)
                radiusmin = data[i].radius;
            data[i].radius += 50;
            if (data[i].radius > 1920)
                data.splice(i,1);
        }
        if (radiusmin >= 200) {
            if (data[data.length-1].generation+1 >= maxGenerations)
                stop();
            else
                newgendata = nextgeneration(0, 0, data[data.length-1].generation+1);
        }
    }
    display();
}

function validate() {
    return true;
}

function create_first_ring(scores, population) {
    data = [];
    var angleIncrementor = 360.0 / scores.length;
    var currentAngle = 0.0;
    for (i = 0; i < scores.length; i++) {
        var newobj = {
            radius: 50, 
            angle: currentAngle, 
            score: scores[i],
            generation: 0,
            data: population[i]
        };
        data.push(newobj);
        currentAngle += angleIncrementor;
    }
}

function display() {
    var canvas = document.getElementById('display-god');
    var context = canvas.getContext('2d');
    context.canvas.width  = window.innerWidth - 19;
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = 10 + (10 * (canvas.width / 1920)) - ((populationSize / 1000) * 9.8);
    
    for (i = 0; i < data.length; i++) {
        var iradius = data[i].radius * (canvas.width / 1920);
        context.beginPath();
        context.arc(centerX + ((iradius + (i % 2 == 0 ? radius * 2.0 : 0)) * Math.sin((Math.PI * 2 / 360) * data[i].angle)), centerY + ((iradius + (i % 2 == 0 ? radius * 2.0: 0)) * Math.cos((Math.PI * 2 / 360) * data[i].angle)), radius, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgb(' + parseInt(((1.0-data[i].score)*185.0)) + ',' + parseInt(data[i].score*185.0) + ',0)';
        context.fill();
        context.lineWidth = 3 * (canvas.width / 1920);
        if (newgendata != null && (newgendata.indices[0] == i || newgendata.indices[1] == i))
            context.strokeStyle = '#DDDDDD';
        else
            context.strokeStyle = '#000000';
        context.stroke();
        context.font = (radius - 5) + "px Arial";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(Math.round(data[i].score * 100) / 100, centerX + ((iradius + (i % 2 == 0 ? radius * 2.0 : 0)) * Math.sin((Math.PI * 2 / 360) * data[i].angle)), centerY + ((iradius + (i % 2 == 0 ? radius * 2.0: 0)) * Math.cos((Math.PI * 2 / 360) * data[i].angle)));
    }
}

function generate_population(population_size, list_size) {
    var out = [];
    for (i = 0; i < population_size; i++) {
        var gen = "";
        for (j = 0; j < list_size; j++) {
            gen += (Math.random() > 0.5 ? "1" : "0");
        }
        out.push(gen);
    }
    return out;
}

function eval_scores(population) {
    var out = [];
    for (i = 0; i < population.length; i++) {
        var sum = 0;
        var product = 1;
        for (j = 0; j < population[i].length; j++) {
            sum += (population[i].charAt(j) == '0' ? j+1 : 0);
            product *= (population[i].charAt(j) == '1' ? j+1 : 1);
        }
        out.push(1/(1+Math.sqrt(Math.pow(sum - ideal_sum, 2) + Math.pow(product - ideal_product, 2))));
    }
    return out;
}

function eval_score(chrom) {
    var out = "";
    var sum = 0;
    var product = 1;
    for (j = 0; j < chrom.length; j++) {
        sum += (chrom.charAt(j) == '0' ? j+1 : 0);
        product *= (chrom.charAt(j) == '1' ? j+1 : 1);
    }
        
    return 1/(1+Math.sqrt(Math.pow(sum - ideal_sum, 2) + Math.pow(product - ideal_product, 2)));
}