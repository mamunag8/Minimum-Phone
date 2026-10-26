import 'package:flutter_test/flutter_test.dart';
import 'package:minimumphone/main.dart';

void main() {
  testWidgets('Minimum Phone renders Home and Purity DNS Guard', (WidgetTester tester) async {
    await tester.pumpWidget(const MinimumPhoneApp());
    expect(find.text('Minimum Phone'), findsWidgets);
  });
}
