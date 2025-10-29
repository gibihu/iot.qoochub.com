import { ConfigType } from "@/types/config";


const defaultConfig: ConfigType = {
    bg: {
        main: "",
        history: [],
    },
};


export class ConfigModel {
    static read(): ConfigType {
        try {
            const raw = localStorage.getItem("config");
            const stored = raw ? JSON.parse(raw) : {};

            // merge default กับ stored
            return {
                ...defaultConfig,
                ...stored,
                bg: {
                    ...defaultConfig.bg,
                    ...(stored.bg ?? {}),
                },
            };
        } catch {
            return defaultConfig;
        }
    }
    private static write(data: ConfigType) {
        localStorage.setItem("config", JSON.stringify(data));
    }

    static bg = {
        update(url: string) {
            try {
                const config = ConfigModel.read();

                const prev = config.bg.main;
                if (prev) {
                    config.bg.history = Array.isArray(config.bg.history)
                        ? config.bg.history
                        : [];

                    // ลบออกถ้ามีอยู่แล้ว
                    config.bg.history = config.bg.history.filter(item => item !== prev);

                    // ใส่บนสุด
                    config.bg.history.unshift(prev);

                    // จำกัด history แค่ 10 entries
                    if (config.bg.history.length > 10) {
                        config.bg.history = config.bg.history.slice(0, 10);
                    }
                }


                config.bg.main = url;

                ConfigModel.write(config);
                return true;
            } catch (error) {
                throw error;
            }
        },
        get(){
            try{
                return ConfigModel.read().bg;
            }catch(error){
                throw error;
            }
        },
    };
}
