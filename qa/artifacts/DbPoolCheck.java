import java.nio.file.*;
import java.sql.*;
import java.util.regex.*;
class DbPoolCheck {
  static String value(String s, String key) {
    var m = Pattern.compile("(?m)^\\s*" + key + ":\\s*(.+)$").matcher(s);
    if (!m.find()) throw new IllegalArgumentException(key);
    return m.group(1).trim().replaceAll("^[\"']|[\"']$", "");
  }
  public static void main(String[] args) throws Exception {
    var config = Files.readString(Path.of("backend/src/main/resources/application.yaml"));
    var url = value(config, "url").replace(":5432/", ":6543/");
    if (!url.contains("prepareThreshold=")) url += (url.contains("?") ? "&" : "?") + "prepareThreshold=0";
    DriverManager.setLoginTimeout(8);
    try (var c = DriverManager.getConnection(url, value(config, "username"), value(config, "password"))) {
      c.setAutoCommit(false);
      try (var s = c.prepareStatement("SELECT COUNT(*) FROM public.products WHERE is_active = ?")) {
        s.setBoolean(1, true);
        for (int i = 0; i < 7; i++) {
          try (var r = s.executeQuery()) { if (!r.next()) throw new AssertionError("No result"); }
          c.commit();
        }
      }
      System.out.println("PASS transaction pool: login, product query, repeated prepared queries and commit");
    } catch (SQLException e) { System.out.println("Database failure: " + e.getSQLState() + " " + e.getMessage()); System.exit(1); }
  }
}
