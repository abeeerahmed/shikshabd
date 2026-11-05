import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class AnalyticsServer {
    static final String CSV = "../../all_institutes_clean.csv";

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8090), 0);
        server.createContext("/api/analytics/summary", AnalyticsServer::summary);
        server.createContext("/api/analytics/top-divisions", AnalyticsServer::topDivisions);
        server.createContext("/api/analytics/by-type", AnalyticsServer::byType);
        server.createContext("/health", ex -> respond(ex, 200, "{\"status\":\"ok\",\"service\":\"java\"}"));
        server.setExecutor(null);
        System.out.println("Java Analytics Service running on http://localhost:8090");
        server.start();
    }

    static List<String[]> readCsv() throws IOException {
        List<String[]> rows = new ArrayList<>();
        List<String> lines = Files.readAllLines(Paths.get(CSV), StandardCharsets.UTF_8);
        for (int i = 1; i < lines.size(); i++) {
            String line = lines.get(i);
            if (line.trim().isEmpty()) continue;
            // simple split (no quoted commas in our data)
            rows.add(line.split(",", -1));
        }
        return rows;
    }

    static void summary(HttpExchange ex) throws IOException {
        try {
            List<String[]> rows = readCsv();
            int total = rows.size();
            int primary = 0, post = 0;
            for (String[] r : rows) {
                if (r.length > 4) {
                    if ("Primary".equals(r[4])) primary++;
                    else if ("Post-Primary".equals(r[4])) post++;
                }
            }
            String json = String.format("{\"total_institutes\":%d,\"primary\":%d,\"post_primary\":%d,\"source\":\"java\"}", total, primary, post);
            respond(ex, 200, json);
        } catch (Exception e) {
            respond(ex, 500, "{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    static void topDivisions(HttpExchange ex) throws IOException {
        try {
            List<String[]> rows = readCsv();
            Map<String, Integer> counts = new TreeMap<>();
            for (String[] r : rows) {
                if (r.length > 5 && r[5] != null && !r[5].isEmpty()) {
                    counts.put(r[5], counts.getOrDefault(r[5], 0) + 1);
                }
            }
            List<Map.Entry<String, Integer>> sorted = new ArrayList<>(counts.entrySet());
            sorted.sort((a, b) -> b.getValue() - a.getValue());
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Map.Entry<String, Integer> e : sorted) {
                if (!first) sb.append(",");
                sb.append(String.format("{\"division\":\"%s\",\"count\":%d}", e.getKey(), e.getValue()));
                first = false;
            }
            sb.append("]");
            respond(ex, 200, sb.toString());
        } catch (Exception e) {
            respond(ex, 500, "{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    static void byType(HttpExchange ex) throws IOException {
        try {
            List<String[]> rows = readCsv();
            Map<String, Integer> counts = new TreeMap<>();
            for (String[] r : rows) {
                if (r.length > 9 && r[9] != null && !r[9].isEmpty()) {
                    counts.put(r[9], counts.getOrDefault(r[9], 0) + 1);
                }
            }
            List<Map.Entry<String, Integer>> sorted = new ArrayList<>(counts.entrySet());
            sorted.sort((a, b) -> b.getValue() - a.getValue());
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Map.Entry<String, Integer> e : sorted) {
                if (!first) sb.append(",");
                sb.append(String.format("{\"type\":\"%s\",\"count\":%d}", e.getKey(), e.getValue()));
                first = false;
            }
            sb.append("]");
            respond(ex, 200, sb.toString());
        } catch (Exception e) {
            respond(ex, 500, "{\"error\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    static void respond(HttpExchange ex, int code, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(code, bytes.length);
        OutputStream os = ex.getResponseBody();
        os.write(bytes);
        os.close();
    }
}