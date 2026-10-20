from rich import print

print('• Objetivo: Descobrir a palavra secreta do dia (que tem 5 letras) em até 6 tentativas')
print('• Como jogar: Digite uma palavra válida de 5 letras em português e aperte Enter.')
print('• Mudança das letras: Após cada palpite, as letras mudam de formato para indicar o quão perto você está da resposta:')
print('|a| : letra na palavra no lugar certo.')
print('a : letra na palavra no lugar errado.')
print('[strike]a[/strike] : Letra não existênte na palavra.')

palavra = input('Escreva uma palavra de cinco letras: ')
palavra = list(palavra.lower())

if len(palavra) != 5:
    print('Palavra inválida')
    print(palavra)

for i in range(6):
    print('== i° TENTATIVA ==')
    tentativa = input('Escreva a palavra: ')
    for x in palavra:
        print(x)
        
