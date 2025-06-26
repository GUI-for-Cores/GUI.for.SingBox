export namespace bridge {
	
	export class EnvResult {
	    appName: string;
	    basePath: string;
	    os: string;
	    arch: string;
	    x64Level: number;
	
	    static createFrom(source: any = {}) {
	        return new EnvResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.appName = source["appName"];
	        this.basePath = source["basePath"];
	        this.os = source["os"];
	        this.arch = source["arch"];
	        this.x64Level = source["x64Level"];
	    }
	}
	export class ExecOptions {
	    stopOutputKeyword: string;
	    convert: boolean;
	    env: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new ExecOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.stopOutputKeyword = source["stopOutputKeyword"];
	        this.convert = source["convert"];
	        this.env = source["env"];
	    }
	}
	export class FlagResult {
	    flag: boolean;
	    data: string;
	
	    static createFrom(source: any = {}) {
	        return new FlagResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.flag = source["flag"];
	        this.data = source["data"];
	    }
	}
	export class HTTPResult {
	    flag: boolean;
	    status: number;
	    headers: Record<string, string[]>;
	    body: string;
	
	    static createFrom(source: any = {}) {
	        return new HTTPResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.flag = source["flag"];
	        this.status = source["status"];
	        this.headers = source["headers"];
	        this.body = source["body"];
	    }
	}
	export class IOOptions {
	    Mode: string;
	
	    static createFrom(source: any = {}) {
	        return new IOOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Mode = source["Mode"];
	    }
	}
	export class MenuItem {
	    type: string;
	    text: string;
	    tooltip: string;
	    event: string;
	    children: MenuItem[];
	    hidden: boolean;
	    checked: boolean;
	
	    static createFrom(source: any = {}) {
	        return new MenuItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.text = source["text"];
	        this.tooltip = source["tooltip"];
	        this.event = source["event"];
	        this.children = this.convertValues(source["children"], MenuItem);
	        this.hidden = source["hidden"];
	        this.checked = source["checked"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NotifyOptions {
	    AppName: string;
	    Beep: boolean;
	
	    static createFrom(source: any = {}) {
	        return new NotifyOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.AppName = source["AppName"];
	        this.Beep = source["Beep"];
	    }
	}
	export class RequestOptions {
	    Proxy: string;
	    Insecure: boolean;
	    Redirect: boolean;
	    Timeout: number;
	    CancelId: string;
	    FileField: string;
	
	    static createFrom(source: any = {}) {
	        return new RequestOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Proxy = source["Proxy"];
	        this.Insecure = source["Insecure"];
	        this.Redirect = source["Redirect"];
	        this.Timeout = source["Timeout"];
	        this.CancelId = source["CancelId"];
	        this.FileField = source["FileField"];
	    }
	}
	export class ServerOptions {
	    Cert: string;
	    Key: string;
	    StaticPath: string;
	    StaticRoute: string;
	    UploadPath: string;
	    UploadRoute: string;
	    MaxUploadSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ServerOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Cert = source["Cert"];
	        this.Key = source["Key"];
	        this.StaticPath = source["StaticPath"];
	        this.StaticRoute = source["StaticRoute"];
	        this.UploadPath = source["UploadPath"];
	        this.UploadRoute = source["UploadRoute"];
	        this.MaxUploadSize = source["MaxUploadSize"];
	    }
	}
	export class TrayContent {
	    icon: string;
	    title: string;
	    tooltip: string;
	
	    static createFrom(source: any = {}) {
	        return new TrayContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.icon = source["icon"];
	        this.title = source["title"];
	        this.tooltip = source["tooltip"];
	    }
	}

}

