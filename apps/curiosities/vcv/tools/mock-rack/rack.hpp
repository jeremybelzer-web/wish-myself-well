// Minimal stand-in for Rack's API, only to syntax-check the generated code. Not Rack.
#pragma once
#include <string>
#include <memory>
#include <cmath>
#include <algorithm>
#include <cstdarg>
#include <cstdio>
#include <vector>
namespace rack { struct plugin_Plugin; }
struct json_t {};
inline json_t* json_object(){return nullptr;} inline int json_object_set_new(json_t*,const char*,json_t*){return 0;}
inline json_t* json_object_get(json_t*,const char*){return nullptr;} inline void json_decref(json_t*){}
struct NVGcolor{float r,g,b,a;}; inline NVGcolor nvgRGB(int,int,int){return {};}
struct NVGcontext{}; enum{NVG_ALIGN_LEFT=1,NVG_ALIGN_TOP=8};
inline void nvgFontFaceId(NVGcontext*,int){} inline void nvgFontSize(NVGcontext*,float){} inline void nvgFillColor(NVGcontext*,NVGcolor){}
inline void nvgTextAlign(NVGcontext*,int){} inline void nvgTextLineHeight(NVGcontext*,float){} inline void nvgTextBox(NVGcontext*,float,float,float,const char*,const char*){}
namespace rack {
namespace math { struct Vec{float x=0,y=0;Vec(){}Vec(float a,float b):x(a),y(b){}}; template<class T> T clamp(T x,T a,T b){return std::min(std::max(x,a),b);} }
using math::Vec; using math::clamp;
namespace string { inline std::string f(const char* fmt,...){char b[256];va_list a;va_start(a,fmt);vsnprintf(b,256,fmt,a);va_end(a);return b;} }
namespace asset { inline std::string system(std::string s){return s;} inline std::string plugin(rack::plugin_Plugin*,std::string s){return s;} }
namespace dsp { struct ClockDivider{void setDivision(int){} bool process(){return true;}}; }
namespace midi { struct Message{void setStatus(int){} void setNote(int){} void setValue(int){}};
 struct Output{void reset(){} void setChannel(int){} int getDeviceId(){return 0;} json_t* toJson(){return nullptr;} void fromJson(json_t*){} void sendMessage(const Message&){}}; }
namespace window { struct Font{int handle=0;}; }
struct Window{std::shared_ptr<window::Font> loadFont(std::string){return nullptr;}}; struct App{Window* window;}; inline App* APP;
namespace engine { struct Input{bool isConnected(){return true;} float getVoltage(){return 0;}};
 struct Module{ std::vector<Input> inputs; struct ProcessArgs{}; virtual ~Module(){} void config(int,int,int,int){} void configInput(int,std::string){}
  virtual void onReset(){} virtual void process(const ProcessArgs&){} virtual json_t* dataToJson(){return nullptr;} virtual void dataFromJson(json_t*){} }; }
using engine::Module;
namespace widget { struct Widget{ struct{Vec pos,size;} box; struct DrawArgs{NVGcontext* vg;}; virtual ~Widget(){} virtual void draw(const DrawArgs&){} void addChild(Widget*){} }; }
using widget::Widget;
namespace ui { struct Menu:Widget{}; struct MenuSeparator:Widget{}; }
using ui::Menu; using ui::MenuSeparator;
inline Widget* createMenuLabel(std::string){return new Widget;}
namespace app { struct SvgPanel:Widget{}; struct PortWidget:Widget{}; struct ModuleWidget:Widget{ Module* module; void setModule(Module* m){module=m;} void setPanel(Widget*){} void addInput(PortWidget*){} virtual void appendContextMenu(Menu*){} };
 inline void appendMidiMenu(Menu*, midi::Output*){} }
using app::ModuleWidget; using app::appendMidiMenu;
struct PJ301MPort: app::PortWidget{};
template<class T> T* createInputCentered(Vec, Module*, int){return new T;}
inline Widget* createPanel(std::string){return new Widget;}
inline Vec mm2px(Vec v){return v;}
struct Model; struct plugin_Plugin { void addModel(Model*){} }; using Plugin=plugin_Plugin;
struct Model{};
template<class M,class W> Model* createModel(std::string){ (void)sizeof(M); auto f=[](M* m){ return new W(m); }; (void)f; return new Model; }
}
#include <vector>
