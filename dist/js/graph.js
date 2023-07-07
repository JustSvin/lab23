function groupRows(rows, groupField) {
    // Группирует данные таблицы по определённому полю
    let field_i = get_field_index(groupField);
    return d3.group(rows, row => row[field_i]);
}


function processGroup(groupRows, yField) {
    // Обрабатывает сгруппированную группу строк groupRows в зависимости от значения yField 
    if (yField == "Количество") {
        let count = groupRows.length;
        return count;
    } else if (yField == "Средняя цена") {
        let count = groupRows.length;
        let totalCost = 0;
        let costFieldIndex = get_field_index("Цена");
        groupRows.forEach((row) => {
            totalCost += Number(row[costFieldIndex]);
        });
        let mean = totalCost / count;
        return mean;
    }
}


function getGraphData(rows, xField, yField) {
    /*
    Возвращает данные таблицы в виде:
    {
        <Значение по x 1>: число,
        ...
    }
    */
    let groupedData = groupRows(rows, xField);
    let result = {};
    for (let group of groupedData) {
        let groupField = group[0];
        let groupRows = group[1];
        result[groupField] = processGroup(groupRows, yField);
    }
    return result
}

function getDataRange(graphData) {
    // Находит размах данных по оси Y
    let values = Object.values(graphData);
    let dataMin = d3.min(values);
    let dataMax = d3.max(values);
    return [dataMin, dataMax];
}


function onDrawGraphClicked(graph_form) {
    // Рисует график после нажатия "Построить график"
    let xField = graph_form["ox"].value;
    let yField = graph_form["oy"].value;
    let rows = get_sorted_filtered_data();
    let data = getGraphData(rows, xField, yField);
    drawGraph(data);
}


function drawGraph(graphData) {
    // Рисует диаграмму по данным
    let marginX = 50;
    let marginY = 60;
    let height = 400;
    let width = 1200;
    let svg = d3.select("svg")
        .attr("height", height)
        .attr("width", width);

    // очищаем svg перед построением 
    svg.selectAll("*").remove();

    // определяем минимальное и максимальное значение по оси OY 
    let yRange = getDataRange(graphData)
    let min = yRange[0] * 0.95;
    let max = yRange[1] * 1.05;

    // Вычисляем длины осей в пикселях
    let xAxisLen = width - 2 * marginX;
    let yAxisLen = height - 2 * marginY;

    // Получаем все значения по оси X
    let xLabels = Object.keys(graphData)

    // определяем шкалы для осей 
    let scaleX = d3.scaleBand()
        .domain(xLabels)
        .range([0, xAxisLen], 1)
        .padding(0.2);
    let scaleY = d3.scaleLinear()
        .domain([min, max])
        .range([yAxisLen, 0]);

    // создаем оси 
    let axisX = d3.axisBottom(scaleX); // горизонтальная 
    let axisY = d3.axisLeft(scaleY); // вертикальная 

    // отображаем ось OX, устанавливаем подписи оси ОX и угол их наклона 
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${height - marginY})`)
        .call(axisX)
        .attr("class", "x-axis")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // отображаем ось OY 
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .attr("class", "y-axis")
        .call(axisY);

    // создаем набор вертикальных линий для сетки 
    d3.selectAll("g.x-axis g.tick")
        .append("line") // добавляем линию 
        .classed("grid-line", true) // добавляем класс 
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", - (yAxisLen));

    // создаем горизонтальные линии сетки 
    d3.selectAll("g.y-axis g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", xAxisLen)
        .attr("y2", 0);

    // отображаем данные в виде диаграммы 
    let segmentWidth = scaleX.bandwidth()
    svg.selectAll(".dot")
        .data(xLabels)
        .enter()
        .append("rect")
        .attr("x", function(xLabel) { return scaleX(xLabel) })
        .attr("width", segmentWidth)
        .attr("y", function (xLabel) { return scaleY(graphData[xLabel]) })
        .attr("height", function (xLabel) { return yAxisLen - scaleY(graphData[xLabel]); })
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .attr("fill", "red");
}