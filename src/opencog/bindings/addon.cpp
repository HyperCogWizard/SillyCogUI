#include <napi.h>
#include "cpp/opencog_client.hpp"
#include <memory>

using namespace SillyCogUI::OpenCog;

class OpenCogWrapper : public Napi::ObjectWrap<OpenCogWrapper> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    OpenCogWrapper(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;
    
    Napi::Value Initialize(const Napi::CallbackInfo& info);
    Napi::Value Connect(const Napi::CallbackInfo& info);
    Napi::Value Disconnect(const Napi::CallbackInfo& info);
    Napi::Value IsConnected(const Napi::CallbackInfo& info);
    Napi::Value SendMessage(const Napi::CallbackInfo& info);
    Napi::Value LoadKnowledgeBase(const Napi::CallbackInfo& info);
    Napi::Value AddConcept(const Napi::CallbackInfo& info);
    Napi::Value QueryConcepts(const Napi::CallbackInfo& info);
    Napi::Value SetReasoningMode(const Napi::CallbackInfo& info);
    Napi::Value SetConfidenceThreshold(const Napi::CallbackInfo& info);
    Napi::Value SetMaxResponseLength(const Napi::CallbackInfo& info);
    Napi::Value GetStatus(const Napi::CallbackInfo& info);
    Napi::Value GetCognitiveStats(const Napi::CallbackInfo& info);
    
    std::unique_ptr<OpenCogClient> client_;
};

Napi::FunctionReference OpenCogWrapper::constructor;

Napi::Object OpenCogWrapper::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "OpenCogClient", {
        InstanceMethod("initialize", &OpenCogWrapper::Initialize),
        InstanceMethod("connect", &OpenCogWrapper::Connect),
        InstanceMethod("disconnect", &OpenCogWrapper::Disconnect),
        InstanceMethod("isConnected", &OpenCogWrapper::IsConnected),
        InstanceMethod("sendMessage", &OpenCogWrapper::SendMessage),
        InstanceMethod("loadKnowledgeBase", &OpenCogWrapper::LoadKnowledgeBase),
        InstanceMethod("addConcept", &OpenCogWrapper::AddConcept),
        InstanceMethod("queryConcepts", &OpenCogWrapper::QueryConcepts),
        InstanceMethod("setReasoningMode", &OpenCogWrapper::SetReasoningMode),
        InstanceMethod("setConfidenceThreshold", &OpenCogWrapper::SetConfidenceThreshold),
        InstanceMethod("setMaxResponseLength", &OpenCogWrapper::SetMaxResponseLength),
        InstanceMethod("getStatus", &OpenCogWrapper::GetStatus),
        InstanceMethod("getCognitiveStats", &OpenCogWrapper::GetCognitiveStats)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("OpenCogClient", func);
    return exports;
}

OpenCogWrapper::OpenCogWrapper(const Napi::CallbackInfo& info) : Napi::ObjectWrap<OpenCogWrapper>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    
    client_ = std::make_unique<OpenCogClient>();
}

Napi::Value OpenCogWrapper::Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    std::string config_path = "";
    if (info.Length() > 0 && info[0].IsString()) {
        config_path = info[0].As<Napi::String>().Utf8Value();
    }
    
    bool result = client_->initialize(config_path);
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::Connect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected endpoint string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string endpoint = info[0].As<Napi::String>().Utf8Value();
    int port = 17001;
    
    if (info.Length() > 1 && info[1].IsNumber()) {
        port = info[1].As<Napi::Number>().Int32Value();
    }
    
    bool result = client_->connect(endpoint, port);
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::Disconnect(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    bool result = client_->disconnect();
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::IsConnected(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    bool result = client_->is_connected();
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::SendMessage(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected message string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string content = info[0].As<Napi::String>().Utf8Value();
    std::string role = "user";
    
    if (info.Length() > 1 && info[1].IsString()) {
        role = info[1].As<Napi::String>().Utf8Value();
    }
    
    try {
        ChatResponse response = client_->send_message(content, role);
        
        Napi::Object result = Napi::Object::New(env);
        result.Set("content", response.content);
        result.Set("confidence", response.confidence);
        
        Napi::Array suggestions = Napi::Array::New(env, response.suggestions.size());
        for (size_t i = 0; i < response.suggestions.size(); i++) {
            suggestions[i] = response.suggestions[i];
        }
        result.Set("suggestions", suggestions);
        
        Napi::Object cognitiveData = Napi::Object::New(env);
        for (const auto& pair : response.cognitive_data) {
            cognitiveData.Set(pair.first, pair.second);
        }
        result.Set("cognitiveData", cognitiveData);
        
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value OpenCogWrapper::LoadKnowledgeBase(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected knowledge base path string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string kb_path = info[0].As<Napi::String>().Utf8Value();
    bool result = client_->load_knowledge_base(kb_path);
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::AddConcept(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected concept string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string concept_name = info[0].As<Napi::String>().Utf8Value();
    std::map<std::string, std::string> attributes;
    
    if (info.Length() > 1 && info[1].IsObject()) {
        Napi::Object attrs = info[1].As<Napi::Object>();
        Napi::Array keys = attrs.GetPropertyNames();
        
        for (uint32_t i = 0; i < keys.Length(); i++) {
            Napi::Value key = keys[i];
            std::string keyStr = key.As<Napi::String>().Utf8Value();
            std::string valueStr = attrs.Get(key).As<Napi::String>().Utf8Value();
            attributes[keyStr] = valueStr;
        }
    }
    
    bool result = client_->add_concept(concept_name, attributes);
    return Napi::Boolean::New(env, result);
}

Napi::Value OpenCogWrapper::QueryConcepts(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected pattern string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string pattern = info[0].As<Napi::String>().Utf8Value();
    std::vector<std::string> concepts = client_->query_concepts(pattern);
    
    Napi::Array result = Napi::Array::New(env, concepts.size());
    for (size_t i = 0; i < concepts.size(); i++) {
        result[i] = concepts[i];
    }
    
    return result;
}

Napi::Value OpenCogWrapper::SetReasoningMode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected mode string").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string mode = info[0].As<Napi::String>().Utf8Value();
    client_->set_reasoning_mode(mode);
    return env.Undefined();
}

Napi::Value OpenCogWrapper::SetConfidenceThreshold(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected threshold number").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    double threshold = info[0].As<Napi::Number>().DoubleValue();
    client_->set_confidence_threshold(threshold);
    return env.Undefined();
}

Napi::Value OpenCogWrapper::SetMaxResponseLength(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected max length number").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    int max_length = info[0].As<Napi::Number>().Int32Value();
    client_->set_max_response_length(max_length);
    return env.Undefined();
}

Napi::Value OpenCogWrapper::GetStatus(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string status = client_->get_status();
    return Napi::String::New(env, status);
}

Napi::Value OpenCogWrapper::GetCognitiveStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::map<std::string, std::string> stats = client_->get_cognitive_stats();
    
    Napi::Object result = Napi::Object::New(env);
    for (const auto& pair : stats) {
        result.Set(pair.first, pair.second);
    }
    
    return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return OpenCogWrapper::Init(env, exports);
}

NODE_API_MODULE(opencog_addon, Init)