
var width = 750, height = 600;
var radius = Math.min(width, height) / 2;


var x = d3.scale.linear().range([0, 2 * Math.PI]),
    y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, radius]),
    padding = 5;

var color = d3.scale.category20c();

// Total size of all segments
var totalSize = 0;

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", '100%')
    .attr("height", '100%')
    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
    .attr('preserveAspectRatio','xMinYMin')
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

d3.json("data/revenue_data.json", function(json) {
    createVisualization(json);
});

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius)
        .style("opacity", 0);

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition.nodes(json)
        .filter(function(d) {
            return (d.dx > 0.05); // 0.005 radians = 0.29 degrees
        });

    var path = vis.data([json]).selectAll("path")
        .data(nodes)
        .enter().append("g")

        path.append("svg:path")
        .attr("display", function(d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .attr("fill-rule", "evenodd")
        .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
        .style("opacity", 1)
        .on("mouseover", mouseover);

    // Add the mouseleave handler to the bounding circle.
    d3.select("#container").on("mouseleave", mouseleave);

    // Get total size of the tree = value of root node from partition.
    totalSize = path.node().__data__.size;
    function computeTextRotation(d) {
        var ang = (d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180;
        return (ang > 135) ? 180 + ang : ang;
    }
    path.append("svg:text")

          //.attr("transform", function(d) { return "rotate(" + (d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180 + ")"; })
        .attr("transform", function(d) {
            console.log(d.name)
            console.log(arc.centroid(d))

            return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; })
        //.attr('text-anchor', function (d) { return computeTextRotation(d) > 180 ? "end" : "start"; })

       // .attr("x", function(d) { return Math.sqrt(d.y); })
        .attr("dx", function(d){
            var ang = (d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180;
            if(ang > 90 ){
                return "-5";
            }else if(d.name == "Tax Revenue"){
                return "-60";
            }
            else{
                return "-10";
            }

        }) // margin
        .attr("dy", ".35em") // vertical-align
        .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner
        .style("font-size","14px")
        .style("cursor","default")
        .text(function(d) { return d.name !== "Total Revenue" ? d.name : ''; });
};

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {

    var percentage = (100 * d.size / totalSize).toPrecision(3);
    var percentageString = percentage + "%";
    if (percentage < 0.005) {
        percentageString = "< 0.1%";
    }

    d3.select("#percentage")
        .text(percentageString);
    d3.select("#category")
        .text(d.name)
        .style("font-size", "20px")
    d3.select("#amount")
        .text("(" +d.size + " crores)");
    d3.select("#explanation")
        .style("visibility", "");

    var sequenceArray = getAncestors(d);
   // updateBreadcrumbs(sequenceArray, percentageString);

    // Fade all the segments.
    d3.selectAll("path")
        .style("opacity", 0.3);
    // Fade all the segments.
    d3.selectAll("text")
        .style("opacity", 0.3);


    // Then highlight only those that are an ancestor of the current segment.
    vis.selectAll("path")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);
    vis.selectAll("text")
        .filter(function(node) {
            return (sequenceArray.indexOf(node) >= 0);
        })
        .style("opacity", 1);
}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {

    // Hide the breadcrumb trail
    d3.select("#trail")
        .style("visibility", "hidden");

    // Deactivate all segments during transition.
    d3.selectAll("path").on("mouseover", null);

    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("path")
        .transition()
        .duration(1000)
        .style("opacity", 1)
        .each("end", function() {
            d3.select(this).on("mouseover", mouseover);
        });
    // Transition each segment to full opacity and then reactivate it.
    d3.selectAll("text")
        .transition()
        .duration(1000)
        .style("opacity", 1)


    d3.select("#explanation")
        .style("visibility", "hidden");
}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}



