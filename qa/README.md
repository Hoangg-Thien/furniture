# Kiểm thử FuniStore

Bộ kiểm thử này không sửa mã nghiệp vụ. Các request ghi chạy trên PGlite trong bộ nhớ, không dùng Supabase. Server và bản sao `sales.sql` nằm dưới `qa/`. Kết quả đọc tại [BAO_CAO_KIEM_THU.md](BAO_CAO_KIEM_THU.md).

## Chạy lại trên máy hiện tại

1. Chạy các lệnh sau trong PowerShell ở `D:\furniture` để biên dịch và tạo classpath. Maven Wrapper có lỗi `.Target[0]` trên môi trường hiện tại nên dùng bản Maven có sẵn:

```powershell
$qaMaven = Get-ChildItem C:/Users/LENOVO/.m2/wrapper/dists/apache-maven-3.9.14 -Recurse -Filter mvn.cmd | Select-Object -First 1 -ExpandProperty FullName
& $qaMaven -f backend/pom.xml -o '-Dmaven.repo.local=C:/Users/LENOVO/.m2/repository' test
& $qaMaven -f backend/pom.xml -o '-Dmaven.repo.local=C:/Users/LENOVO/.m2/repository' dependency:build-classpath '-Dmdep.outputFile=D:/furniture/qa/artifacts/classpath.txt'
```

Lệnh test hiện có một assertion không khớp thông báo; Maven trả lỗi sau khi chạy đủ 99 ca. Không coi exit code thành công của các script tổng hợp là mọi ca đều đạt: xem trường `pass` trong JSON.

2. Phụ thuộc PGlite đã cài tại `qa/harness/node_modules`. Nếu thiếu, chạy `npm.cmd install --prefix qa/harness`. Frontend cũng cần dependencies riêng trong `frontend/node_modules`.

3. Mở terminal riêng, chạy `node qa/harness/start.mjs`. Server thử nghiệm sẽ dùng các port 15432, 15433, 18080, 5175. `Ctrl+C` dừng các server. Có thể chọn Java bằng biến `QA_JAVA`; mặc định script dùng JDK 26 đã cài trên máy này.

4. Từ terminal khác, chạy lần lượt:

```powershell
node qa/harness/api-tests.mjs
node qa/harness/extra-api-tests.mjs
node qa/harness/browser-tests.mjs
node qa/harness/clean-start.mjs
```

`api-tests.mjs` tạo fixtures; các script bổ sung và trình duyệt dùng fixtures đó. Có thể chạy lại nhiều lần, nhưng mỗi lần sẽ tạo thêm dữ liệu QA trong database đang chạy. Dừng rồi khởi động `start.mjs` để có database mới.

Playwright được dùng từ runtime có sẵn tại `C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`; Chrome tại `C:/Program Files/Google/Chrome/Application/chrome.exe`. Đổi các đường dẫn trong script nếu chạy trên máy khác. Không có bước cài trình duyệt hay sửa package.json của frontend.

`clean-start.mjs` chạy database trống và backend thứ hai tại port 15434/18081 để kiểm tra khởi tạo nguyên trạng. Nó không dùng database của `start.mjs`.

## An toàn dữ liệu thử nghiệm

- URL JDBC trong cả hai script bị ghi đè sang `127.0.0.1`; username/password là giá trị giả chỉ dùng local.
- Không dùng file seed gốc làm mục tiêu append của ứng dụng: script sao chép vào cây thư mục QA trước khi khởi động backend.
- Endpoint SQL điều khiển `15433` chỉ bind `127.0.0.1`, phục vụ truy vấn trạng thái giữa các bước kiểm thử; không triển khai nó ra ngoài.
- Fixtures có mật khẩu tài khoản QA, không chứa mật khẩu Supabase. Thư mục runtime, cache npm và node_modules được bỏ qua bởi `qa/.gitignore`.
