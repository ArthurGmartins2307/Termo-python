from rich import print
import getpass

print('• Objetivo: Descobrir a palavra secreta do dia (que tem 5 letras) em até 6 tentativas')
print('• Como jogar: Digite uma palavra válida de 5 letras em português e aperte Enter.')
print('• Mudança das letras: Após cada palpite, as letras mudam de formato para indicar o quão perto você está da resposta:')
print('|a| : letra na palavra no lugar certo.')
print('a : letra na palavra no lugar errado.')
print('[strike]a[/strike] : Letra não existênte na palavra.')

palavra = getpass.getpass('Escreva uma palavra de cinco letras: ')
palavra = list(palavra.lower())

if len(palavra) != 5:
    print('Palavra inválida')
    print(palavra)

    
for i in range(1,7):
    print(f'== {i}° TENTATIVA ==')
    tentativa = input('Escreva a palavra: ')
    tentativa = list(tentativa.lower())
    for x in range(len(palavra)):
        letra_tentativa = tentativa[x]
        letra_palavra = palavra[x]
        if letra_tentativa in palavra and letra_tentativa == letra_palavra:
            print(f'|{letra_tentativa}|')
        elif letra_tentativa in palavra and letra_tentativa != letra_palavra:
            print(f'{letra_tentativa}')
        else:
            print(f'[strike]{letra_tentativa}[/strike]')
    if tentativa == palavra:
        print('Parabéns, você acertou a palavra!!!')
        break

if tentativa != palavra:
    print(f'Você perdeu :(  A palavra era: {palavra}')