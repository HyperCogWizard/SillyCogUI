#ifndef OPENCOG_CLIENT_HPP
#define OPENCOG_CLIENT_HPP

#include <string>
#include <vector>
#include <memory>
#include <map>

namespace SillyCogUI {
namespace OpenCog {

/**
 * @brief OpenCog chat message structure
 */
struct ChatMessage {
    std::string role;
    std::string content;
    std::string timestamp;
    std::map<std::string, std::string> metadata;
};

/**
 * @brief OpenCog chatbot response structure
 */
struct ChatResponse {
    std::string content;
    double confidence;
    std::vector<std::string> suggestions;
    std::map<std::string, std::string> cognitive_data;
};

/**
 * @brief Main OpenCog client for LLM integration
 */
class OpenCogClient {
public:
    OpenCogClient();
    ~OpenCogClient();

    // Core functionality
    bool initialize(const std::string& config_path = "");
    bool connect(const std::string& endpoint, int port = 17001);
    bool disconnect();
    bool is_connected() const;

    // Chat interface
    ChatResponse send_message(const ChatMessage& message);
    ChatResponse send_message(const std::string& content, const std::string& role = "user");
    
    // Cognitive operations
    bool load_knowledge_base(const std::string& kb_path);
    bool add_concept(const std::string& concept_name, const std::map<std::string, std::string>& attributes);
    std::vector<std::string> query_concepts(const std::string& pattern);
    
    // Configuration
    void set_reasoning_mode(const std::string& mode);
    void set_confidence_threshold(double threshold);
    void set_max_response_length(int max_length);
    
    // Status and monitoring
    std::string get_status() const;
    std::map<std::string, std::string> get_cognitive_stats() const;

private:
    class Impl;
    std::unique_ptr<Impl> pImpl;
};

} // namespace OpenCog
} // namespace SillyCogUI

#endif // OPENCOG_CLIENT_HPP