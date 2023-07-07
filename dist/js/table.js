function get_field_index(field) {
    // Возвращает индекс столбца с именем field
    return headers.indexOf(field);
}

// Текущая конфигурация фильтра
let filter_data = {
    name: "",
    casing: "",
    generation: "",
    startYear: {
        from: "",
        to: ""
    },
    endYear: {
        from: "",
        to: ""
    },
    price: {
        from: "",
        to: ""
    }
}

// Текущая конфигурация сортировки
let sort_data = [
    {
        field_index: -1,
        descend: false
    }, 
    {
        field_index: -1,
        descend: false
    }, 
    {
        field_index: -1,
        descend: false
    }, 
]

// Типы данных каждого столбца. От этого будет зависить, как данные будут сортироваться: как число или как строка
let header_types = {
    "Название": "Строка", 
    "Тип кузова": "Строка", 
    "Поколение": "Строка", 
    "Год начала выпуска": "Число", 
    "Год конца выпуска": "Число", 
    "Цена": "Число"
}


function compare_str(s1, s2, reverse) {
    /*
    Функция сравнения строк. Сравнивает s1 и s2 в порядке возрастания.
    Если reverse==True, то сравнивает в порядке убывания
    */
    if (reverse) {
        if (s1 > s2)
            return -1;
        if (s1 < s2)
            return 1;
        return 0;
    } else {
        if (s1 < s2)
            return -1;
        if (s1 > s2)
            return 1;
        return 0;
    }
}

function compare_num(n1, n2, reverse) {
    /*
    Функция сравнения чисел. Сравнивает n1 и n2 в порядке возрастания.
    Если reverse==True, то сравнивает в порядке убывания
    */
    if (isNaN(n1)) {
        n1 = Infinity;
    }
    if (isNaN(n2)) {
        n2 = Infinity;
    }
    if (reverse) {
        return n2 - n1
    } else {
        return n1 - n2
    }
}


function get_compare_function() {
    /* Возвращает функцию сравнения строк таблицы по трём параметрам */

    // Функции сравнения для каждого уровня. 
    // По умолчанию (если в сортировке стоит "Нет") будет возвращать 0, чтобы не изменять порядок строк
    let functions_list = [
        (data1, data2) => 0, 
        (data1, data2) => 0, 
        (data1, data2) => 0
    ];
    
    // Создаём функции сравнения строк для каждого уровня сортировки
    sort_data.forEach((el, i) => {  // Проходимся по каждому уровню сортировки
        if (el.field_index !== -1) {  // Если выбрано какое-то поле сортировки
            let field = headers[el.field_index];
            if (header_types[field] == "Число") {
                functions_list[i] = (data1, data2) => compare_num(data1, data2, el.descend);
            } else if (header_types[field] == "Строка") {
                functions_list[i] = (data1, data2) => compare_str(data1, data2, el.descend);
            }
        }
    })
    
    return (row1, row2) => {
        let head_i1 = sort_data[0].field_index;
        let head_i2 = sort_data[1].field_index;
        let head_i3 = sort_data[2].field_index;
        return functions_list[0](row1[head_i1], row2[head_i1]) 
            || functions_list[1](row1[head_i2], row2[head_i2]) 
            || functions_list[2](row1[head_i3], row2[head_i3]);
    }
}


function get_sorted_filtered_data() {
    /* Возвращает отсортированные и отфильтрованные данные таблицы */
    let data = table_data
    data = apply_filtering(data);
    data.sort(get_compare_function());
    return data;
}


function fillTable() {
    /* Заполняет html-таблицу данными */

    let data = get_sorted_filtered_data();

    let table = document.getElementById("car-table");
    let tbody = table.getElementsByTagName("tbody")[0];
    data.forEach((data_row) => {
        let row = tbody.insertRow();
        data_row.forEach((data_cell) => {
            row.insertCell().innerHTML = data_cell;
        });
    });
}

function clearTable() {
    /* Удаляет все данные из html-таблицы */
    let table = document.getElementById("car-table");
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }
}


function onFilterChanged() {
    /* Выполняется после нажатия кнопки фильтрации */

    // Получаем все данные из формы фильтра
    let f = document.forms["filter"];
    filter_data.name = f["name"].value;
    filter_data.casing = f["casing"].value;
    filter_data.generation = f["generation"].value;
    filter_data.startYear.from = f["startYearFrom"].value;
    filter_data.startYear.to = f["startYearTo"].value;
    filter_data.endYear.from = f["endYearFrom"].value;
    filter_data.endYear.to = f["endYearTo"].value;
    filter_data.price.from = f["priceFrom"].value;
    filter_data.price.to = f["priceTo"].value;

    clearTable();
    fillTable();
}

function onSortChanged() {
    /* Выполняется после нажатия кнопки сортировки */

    let f = document.forms["sort"];
    sort_data[0].field_index = +f["sortFirst"].value;
    sort_data[0].descend = f["descFirst"].checked;
    sort_data[1].field_index = +f["sortSecond"].value;
    sort_data[1].descend = f["descSecond"].checked;
    sort_data[2].field_index = +f["sortThird"].value;
    sort_data[2].descend = f["descThird"].checked;

    clearTable();
    fillTable();
    disableUsedSortOptions();
}


function apply_filtering(rows) {
    /* Фильтрует строки таблицы по заданным фильтрам */
    
    let res = [];  // Отфильтрованные строки
    for (let i in rows) {
        let el = rows[i];

        // Проверяем название, кузов, поколение
        // Ок, если либо поле пустое, либо значение является подстрокой строки
        let name_ok = (!Boolean(filter_data.name)) || el[0].includes(filter_data.name);
        let casing_ok = (!Boolean(filter_data.casing)) || el[1].includes(filter_data.casing);
        let generation_ok = (!Boolean(filter_data.generation)) || el[2].includes(filter_data.generation);
        
        // Проверяем числовые значения. 
        // Если не указано "до", то это значение принимается бесконечностью. Если нет "от", то -бесконечность
        let startFrom = filter_data.startYear.from ? +filter_data.startYear.from: -Infinity;
        let startTo = filter_data.startYear.to ? +filter_data.startYear.to: Infinity;
        let endFrom = filter_data.endYear.from ? +filter_data.endYear.from: -Infinity;
        let endTo = filter_data.endYear.to ? +filter_data.endYear.to: Infinity;
        let priceFrom = filter_data.price.from ? +filter_data.price.from: -Infinity;
        let priceTo = filter_data.price.to ? +filter_data.price.to: Infinity;
        let start_ok =  el[3] >= startFrom && el[3] <= startTo;
        let end_ok =  el[4] >= endFrom && el[4] <= endTo;
        let price_ok = el[5] >= priceFrom && el[5] <= priceTo;

        let is_ok = name_ok && casing_ok && generation_ok && start_ok && end_ok && price_ok;
        if (is_ok) {
            res.push(el);
        }
    };
    return res;
}


function disableUsedSortOptions() {
    /* В формах сортировки убирает из выбора уже используемые поля */

    let f = document.forms["sort"];
    let options = [
        f["sortFirst"].getElementsByTagName("option"),
        f["sortSecond"].getElementsByTagName("option"),
        f["sortThird"].getElementsByTagName("option")
    ]  // Все теги option

    // Сначала включаем все элементы, если какие-либо были выключены
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < options[i].length; j++) {
            options[i][j].disabled = false;
        }
    }

    // Выключаем все выбранные варианты
    sort_data.forEach((el) => {
        if (el.field_index !== -1) {
            options[0][el.field_index + 1].disabled = true;
            options[1][el.field_index + 1].disabled = true;
            options[2][el.field_index + 1].disabled = true;
        }
    });
}


function clearFilter() {
    // Очищает поля фильтра
    let f = document.forms["filter"];
    for (let i in f.elements) {
        let el = f.elements[i];
        el.value = ""
    };
    onFilterChanged();
}


function clearSort() {
    // Очищает поля сортировки
    let f = document.forms["sort"];
    f["sortFirst"].value = "-1"
    f["sortSecond"].value = "-1"
    f["sortThird"].value = "-1"
    f["descFirst"].checked = false;
    f["descSecond"].checked = false;
    f["descThird"].checked = false;
    onSortChanged();
}

function setFilterListeners() {
    /* Устанавливает событие изменения всем элементам формы фильтра */
    let f = document.forms["filter"];
    for (let i in f.elements) {
        let el = f.elements[i];
        el.onchange = onFilterChanged
    };
}

function setSortListeners() {
    /* Устанавливает событие изменения всем элементам формы сортировки */

    let f = document.forms["sort"];
    for (let i in f.elements) {
        let el = f.elements[i];
        el.onchange = onSortChanged
    };
}



document.addEventListener("DOMContentLoaded", () => {
    // Выполняется после загрузки страницы
    fillTable();
    setFilterListeners();
    setSortListeners();
});

