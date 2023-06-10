/**
 * app.js
 * @author 知我何求
 */
var $header, //头部DOM
    $header_h = 0, //头部高度
    $footer, //底部DOM
    $footer_h = 0, //底部高度
    $pageDir = 'html', //默认页面目录
    $winName = '', //当前window名称
    $frmName = '', //当前frame名称
    $statusBarStyle = {
        style: 'light',
        color: '-'
    },
    $debug = true, //是否打开调试
    $host = 'http://dapp.lucro.cc', //接口地址
    $version = '1.0.20201023'; //版本号

/**
 * 页面初始化函数
 */
function _ready(options) {
    api.parseTapmode();
    _header();
    _footer();

    if (api && api.winName) $winName = api.winName;
    if (api && api.frameName) $frmName = api.frameName;
    if ($frmName) {
        _log('打开页面：' + $frmName);
    } else {
        _log('打开窗口：' + $winName);
    }

    options = options || {};
    if (options.statusBarStyle) {
        $statusBarStyle = options.statusBarStyle;
    }
    api.setStatusBarStyle($statusBarStyle);
}

function _loadJS(files) {
    var arr = files.split(',');
    for (var i in arr) {
        var element = document.createElement("script");
        element.setAttribute("type", "text/javascript");
        element.setAttribute("src", "../app/" + arr[i] + ".js");
        document.body.appendChild(element);
    }
}

function _loadCSS(files) {
    var arr = files.split(',');
    for (var i in arr) {
        var element = document.createElement("link");
        element.setAttribute("rel", "stylesheet");
        element.setAttribute("type", "text/css");
        element.setAttribute("href", "../app/" + arr[i] + ".css");
        document.getElementsByTagName("head")[0].appendChild(element);
    }
}

/**
 * 写文件日志
 */
function _log(data, type) {
    if (data === undefined) return;
    type = type || 'log';
    if (typeof data == 'object') {
        data = JSON.stringify(data, null, 4);
    }
    var date = _timeFormat('', 'yy/mm/dd');
    var time = _timeFormat('', 'hh:ii:ss.ms');
    data = `[${type}] 窗口名称：${$winName}, 页面名称：${$frmName}\n${data}\n=====${date} ${time}=====\n`;
    var path = 'fs://logs/' + date + '.log';
    api.writeFile({
        path: path,
        data: data,
        append: true
    }, function(ret, err) {
        // if(ret.status){
        //     _console('日志已写入', date, time);
        // }else{
        //     _console(ret, err);
        // }
    });
}

//打开窗口
function _win(name, param) {
    console.log('打开win: ' + name);
    api.openWin({
        name: name,
        url: 'widget://' + $pageDir + '/' + name + '.html',
        pageParam: param || {},
    });
}

//关闭窗口
function _close() {
    _log('关闭当前页面：' + $winName + '/' + $frmName);
    api.closeWin();
}

//打开URL
function _url(url) {
    if (!url) return false;
    if (!/(http|https|ftp|file):\/\//ig.test(url)) {
        url = $host + url;
    }
    api.openWin({
        name: 'urlWin',
        url: url,
        reload: true,
        allowEdit: true
    });
}

//打开页面
function _frm(param) {
    param = param || api.pageParam;
    api.openFrame({
        name: $winName,
        url: './' + $winName + '_frm.html',
        rect: {
            x: 0,
            y: $header_h,
            w: 'auto',
            h: 'auto',
            marginBottom: $footer_h
        },
        reload: true,
        allowEdit: true,
        pageParam: param
    });
}

//获取头部导航栏信息并处理状态栏
function _header() {
    $header = $api.byId('$header');
    if ($header) {
        $api.fixStatusBar($header);
        $header_h = $api.offset($header).h;
    }
}

//获取底部菜单栏信息并处理
function _footer() {
    $footer = $api.byId('$footer');
    if ($footer) {
        $api.fixTabBar($footer);
        $footer_h = $api.offset($footer).h;
    }
}

function _console() {
    if ($debug) {
        for (var i in arguments) {
            if (typeof arguments[i] == 'object') {
                arguments[i] = JSON.stringify(arguments[i]);
            }
            console.log(arguments[i]);
        }
    }
}

/**
 * 发送HTTP请求
 * params
 */
function _ajax(params, showloading) {
    if (!params || !params.url) return false;
    params.data = params.data || {};
    var token = $api.getStorage('token') || '';
    params.data.token = token;
    // params.data.sign = _sign(params.data);
    _console(params);
    if (showloading) {
        api.showProgress({
            title: '加载中...',
            text: '',
            modal: true
        });
    }
    api.ajax({
        url: $host + params.url,
        method: params.method || 'post',
        data: {
            values: params.data || {},
            files: params.files || {}
        }
    }, function(ret, err) {
        if (showloading) api.hideProgress();
        if (ret) {
            _console(ret);
            if (ret.code == -1) {
                if (token && $api.getStorage('token') == token) {
                    $api.rmStorage('token')
                    api.openTabLayout({
                        name: 'login',
                        url: 'widget://html/login.html',
                        title: '登录',
                        pageParam: {},
                        navigationBar: {
                            background: '#1089ff',
                            color: '#fff',
                            shadow: "#1089ff",
                            hideBackButton: true
                        }
                    });
                }
            }
            if (typeof params.success == 'function') {
                params.success(ret);
            }
        } else {
            _console(err);
            _msg('网络请求超时，请稍后重试');
            if (params.error) params.error(err);
        }
    });
}

function _msg(msg, position) {
    if (!msg) return false;
    api.toast({
        msg: msg,
        duration: 2000,
        location: position || 'bottom',
        global: true
    });
}

function _alert(msg, callback) {
    api.alert({
        title: '提示',
        msg: msg,
    }, function(ret, err) {
        if (typeof callback == 'function') callback();
    });
}

function _timeFormat(time, format) {
    var now = Date.now();
    time = parseInt(time) || now;
    var obj = new Date(time),
        data = {
            yy: obj.getFullYear(),
            mm: add0(obj.getMonth() + 1),
            dd: add0(obj.getDate()),
            hh: add0(obj.getHours()),
            ii: add0(obj.getMinutes()),
            ss: add0(obj.getSeconds()),
            ms: now.toString().slice(-3)
        };
    format = format || 'yy-mm-dd hh:ii:ss';
    for (var i in data) {
        format = format.replace(i, data[i]);
    }
    return format;
}

function add0(num) {
    num = parseInt(num);
    if (num < 10) num = '0' + num;
    return num;
}

function _sign(data) {
    var keys = Object.keys(data).sort(),
        obj = {},
        str = '',
        sp = '';
    for (var i in keys) {
        str += sp + keys[i] + '=' + data[keys[i]];
        sp = '&';
    }
    var token = $api.getStorage('token') || '';
    if (token) {
        str += '&token=' + token;
    }
    return md5(str);
}

/**
 * data obj
 * id 父级ID
 * index 返回数据的索引字段
 * pname 父级字段名
 * iname 字段名
 */
function _tree(data, id, index, pname, iname) {
    id = id || 0;
    index = index ? true : false;
    pname = pname || 'pid';
    iname = iname || 'id';
    if (typeof data != 'object') {
        console.warn('data参数错误');
        return false;
    }
    var arr = index ? {} : [];
    for (var i in data) {
        if (data[i][pname] == id) {
            data[i].childs = _tree(data, data[i][iname], index, pname, iname);
            index ? arr[data[i][iname]] = data[i] : arr.push(data[i]);
        }
    }
    return arr;
}