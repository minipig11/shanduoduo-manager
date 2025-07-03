// Example usage in a component
<script setup>
import { getShanduoduoData } from '../api/dbApi';

// Inside your component method
try {
  const data = await getShanduoduoData();
  console.log('Retrieved data:', data);
} catch (error) {
  console.error('Error fetching data:', error);
}
</script>